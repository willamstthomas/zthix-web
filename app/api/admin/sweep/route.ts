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

    // 1. ISOLATE UNRATED LABOR: Corrected primary key to 'event_id'
    const unratedEvents = await sql`
      SELECT event_id, actor_id as clerk_id, resource_id, project_type 
      FROM uesa_event_log 
      WHERE action LIKE 'HUMAN_RESOLUTION_%' 
      AND (financial_status = 'UNRATED' OR financial_status IS NULL)
    `;

    if (unratedEvents.length === 0) {
      return NextResponse.json({ success: true, message: 'SWEEP COMPLETE. NO UNRATED EVENTS FOUND.' });
    }

    let processedVolume = 0;

    for (const ev of unratedEvents) {
      // 2. THE CRYPTOGRAPHIC JOIN: Match the Clerk's ZTHIX-UID back to the Client's Ingestion Event
      const ingestionRecord = await sql`
        SELECT actor_id 
        FROM uesa_event_log 
        WHERE resource_id = ${ev.resource_id} 
        AND action = 'PENDING_RATING' 
        LIMIT 1
      `;
      
      const targetSei = ingestionRecord.length > 0 ? ingestionRecord[0].actor_id : 'UNKNOWN_SEI';

      // 3. TARIFF EXTRACTION: Query the master pricing matrix
      const tariffRecord = await sql`
        SELECT base_rate_usd FROM uesa_tariff_book WHERE project_type = ${ev.project_type} LIMIT 1
      `;
      // Fallback matrix if tariff book is empty
      const rateUsd = tariffRecord.length > 0 ? tariffRecord[0].base_rate_usd : (ev.project_type === 'OPSCORE' ? 0.50 : 2.00);

      // 4. BILL THE CLIENT (LEDGER M)
      // We explicitly reject anonymous black holes. Only bill valid SEIs.
      if (targetSei !== 'UNKNOWN_SEI' && targetSei !== 'Anonymous / Not Provided') {
        await sql`
          INSERT INTO uesa_client_ledger (client_id, event_id, project_type, billed_usd, status)
          VALUES (${targetSei}, ${ev.event_id}, ${ev.project_type}, ${rateUsd}, 'UNPAID')
        `;
      }

      // 5. PAY THE CLERK (LEDGER H)
      await sql`
        INSERT INTO uesa_clerk_ledger (clerk_id, event_id, project_type, earned_usd)
        VALUES (${ev.clerk_id}, ${ev.event_id}, ${ev.project_type}, ${rateUsd})
      `;

      // 6. SEAL THE EVENT: Corrected target to 'event_id'
      await sql`
        UPDATE uesa_event_log SET financial_status = 'RATED' WHERE event_id = ${ev.event_id}
      `;
      
      processedVolume++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `SWEEP COMPLETE. LEDGERS M & H SYNCHRONIZED. ${processedVolume} EVENTS LOCKED.` 
    });

  } catch (error) {
    console.error('UESA Master Sweep Error:', error);
    return NextResponse.json({ error: 'Fatal error during ledger synchronization.' }, { status: 500 });
  }
}
