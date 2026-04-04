import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sei = searchParams.get('sei');

    if (!sei) {
      return NextResponse.json({ error: 'Missing Target SEI.' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL severed.');
    const sql = neon(process.env.DATABASE_URL);

    // Mathematical Aggregation: Group by project_type AND billed_usd (The Tier)
    const ledgerEntries = await sql`
      SELECT 
        c.project_type, 
        c.billed_usd as unit_price,
        COUNT(c.event_id) as volume, 
        SUM(c.billed_usd) as subtotal_usd,
        array_agg(e.resource_id) as uids
      FROM uesa_client_ledger c
      JOIN uesa_event_log e ON c.event_id = e.event_id
      WHERE c.client_id = ${sei} AND c.status = 'UNPAID'
      GROUP BY c.project_type, c.billed_usd
      ORDER BY c.billed_usd ASC
    `;

    if (ledgerEntries.length === 0) {
      return NextResponse.json({ sei: sei, total_usd: "0.00", items: [] });
    }

    let grandTotal = 0;
    const formattedItems = ledgerEntries.map(entry => {
      grandTotal += Number(entry.subtotal_usd);
      return {
        project: entry.project_type,
        volume: Number(entry.volume),
        subtotal_usd: Number(entry.subtotal_usd),
        uids: entry.uids
      };
    });

    return NextResponse.json({
      sei: sei,
      total_usd: grandTotal.toFixed(2),
      items: formattedItems
    });

  } catch (error) {
    console.error('Invoice Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to synchronize with Ledger M.' }, { status: 500 });
  }
}
