import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { adminPasscode } = await request.json();
    
    // Perimeter Defense
    if (adminPasscode !== 'ZTHIX-OMEGA-999') {
      return NextResponse.json({ error: 'Root access denied.' }, { status: 403 });
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable severed.');
    }
    
    const sql = neon(process.env.DATABASE_URL);

    // 1. ISOLATE UNBILLED LABOR
    // FIX 1: Correctly targeting e.id (not event_id)
    const unratedEvents = await sql`
      SELECT e.id, e.actor_id as clerk_id, e.resource_id, e.project_type 
      FROM uesa_event_log e
      LEFT JOIN uesa_client_ledger c ON e.id = c.event_id
      WHERE e.action LIKE 'HUMAN_RESOLUTION_%' 
      AND c.event_id IS NULL
    `;

    if (unratedEvents.length === 0) {
      return NextResponse.json({ success: true, message: 'NO UNBILLED EVENTS FOUND.' });
    }

    let processedVolume = 0;

    for (const ev of unratedEvents) {
      // 2. THE CRYPTOGRAPHIC JOIN
      const ingestionRecord = await sql`
        SELECT actor_id 
        FROM uesa_event_log 
        WHERE resource_id = ${ev.resource_id} 
        AND action = 'PENDING_RATING' 
        LIMIT 1
      `;
      
      const targetSei = ingestionRecord.length > 0 ? ingestionRecord[0].actor_id : 'UNKNOWN_SEI';

      // 3. TARIFF OVERRIDE
      // FIX 2: Bypassing the broken tariff table and using deterministic math
      const rateUsd = (ev.project_type === 'OPSCORE' ? 0.50 : 2.00);

      // 4. BILL CLIENT (LEDGER M)
      if (targetSei !== 'UNKNOWN_SEI' && targetSei !== 'Anonymous / Not Provided') {
        await sql`
          INSERT INTO uesa_client_ledger (client_id, event_id, project_type, billed_usd, status)
          VALUES (${targetSei}, ${ev.id}, ${ev.project_type}, ${rateUsd}, 'UNPAID')
        `;
      }

      // 5. PAY CLERK (LEDGER H)
      const clerkCheck = await sql`SELECT event_id FROM uesa_clerk_ledger WHERE event_id = ${ev.id}`;
      if (clerkCheck.length === 0) {
        await sql`
          INSERT INTO uesa_clerk_ledger (clerk_id, event_id, project_type, earned_usd)
          VALUES (${ev.clerk_id}, ${ev.id}, ${ev.project_type}, ${rateUsd})
        `;
      }

      // 6. SEAL EVENT
      await sql`
        UPDATE uesa_event_log SET financial_status = 'RATED' WHERE id = ${ev.id}
      `;
      
      processedVolume++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `SWEEP COMPLETE. ${processedVolume} EVENTS LOCKED.` 
    });

  } catch (error) {
    console.error('UESA Master Sweep Error:', error);
    return NextResponse.json({ error: 'Fatal error.' }, { status: 500 });
  }
}
