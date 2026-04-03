import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sei = searchParams.get('sei');

    if (!sei) {
      return NextResponse.json({ error: 'Target SEI required.' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is severed.');
    }

    const sql = neon(process.env.DATABASE_URL);

    // Cryptographic Join: Links the Debt (M Ledger) to the Operational Proof (Event Log)
    const rawLedger = await sql`
      SELECT 
        l.invoice_id,
        l.project_type, 
        l.billed_usd, 
        e.resource_id as zthix_uid,
        e.timestamp
      FROM uesa_client_ledger l
      JOIN uesa_event_log e ON l.event_id = e.event_id
      WHERE l.client_id = ${sei} AND l.status = 'UNPAID'
      ORDER BY l.project_type, e.timestamp DESC
    `;

    if (rawLedger.length === 0) {
      return NextResponse.json({ 
        sei, 
        total_usd: 0, 
        message: 'NO OUTSTANDING LIABILITY',
        items: [] 
      });
    }

    // Process the raw ledger into a structured financial payload
    let totalUsd = 0;
    const itemizedGroups: Record<string, any> = {};

    rawLedger.forEach(row => {
      const amount = parseFloat(row.billed_usd);
      totalUsd += amount;

      if (!itemizedGroups[row.project_type]) {
        itemizedGroups[row.project_type] = {
          project: row.project_type,
          volume: 0,
          subtotal_usd: 0,
          uids: []
        };
      }

      itemizedGroups[row.project_type].volume += 1;
      itemizedGroups[row.project_type].subtotal_usd += amount;
      itemizedGroups[row.project_type].uids.push(row.zthix_uid);
    });

    return NextResponse.json({
      sei,
      total_usd: totalUsd.toFixed(2),
      items: Object.values(itemizedGroups)
    });

  } catch (error) {
    console.error('UESA Invoice Extraction Error:', error);
    return NextResponse.json({ error: 'Ledger synchronization failed.' }, { status: 500 });
  }
}
