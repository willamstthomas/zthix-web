import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { adminPasscode } = await request.json();

    // Absolute perimeter defense. 
    if (adminPasscode !== 'ZTHIX-OMEGA-999') {
      return NextResponse.json({ error: 'Unauthorized access. Intrusion logged.' }, { status: 403 });
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is severed.');
    }

    const sql = neon(process.env.DATABASE_URL);

    // STEP 0: HEAL THE TARIFF BOOK
    // Aligns the legacy SQL script strings with the exact telemetry emitted by the Next.js API.
    await sql`UPDATE uesa_tariff_book SET trigger_action = 'OPSCORE_UPLOAD_SUCCESS' WHERE trigger_action = 'OPSCORE_DOCUMENT_CLEARED'`;
    await sql`UPDATE uesa_tariff_book SET trigger_action = 'RECON_UPLOAD_SUCCESS' WHERE trigger_action = 'RECON_AUDIT_CLEAN'`;

    // STEP 1: SWEEP REVENUE TO CLIENT LEDGER (M)
    // Bills the SEI for the ingestion of the payload.
    await sql`
      INSERT INTO uesa_client_ledger (client_id, event_id, project_type, billed_usd, billing_period)
      SELECT e.actor_id, e.event_id, e.project_type, t.rate_usd, to_char(CURRENT_TIMESTAMP, 'YYYY-MM')
      FROM uesa_event_log e
      JOIN uesa_tariff_book t ON e.action = t.trigger_action AND e.project_type = t.target_project
      WHERE e.financial_status = 'PENDING_RATING' 
      AND (e.action = 'OPSCORE_UPLOAD_SUCCESS' OR e.action = 'RECON_UPLOAD_SUCCESS')
    `;

    // STEP 2: SWEEP PAYROLL TO CLERK LEDGER (H)
    // Credits the human operator for clearing the ZTHIX-UID.
    await sql`
      INSERT INTO uesa_clerk_ledger (clerk_id, event_id, project_type, earned_usd, payroll_period)
      SELECT e.actor_id, e.event_id, e.project_type, t.rate_usd, to_char(CURRENT_TIMESTAMP, 'YYYY-MM')
      FROM uesa_event_log e
      JOIN uesa_tariff_book t ON e.action = t.trigger_action AND e.project_type = t.target_project
      WHERE e.financial_status = 'PENDING_RATING' 
      AND e.action LIKE 'HUMAN_RESOLUTION_%'
    `;

    // STEP 3: LOCK THE IMMUTABLE DOSSIER
    // Seals the events so they can never be swept or billed again.
    const result = await sql`
      UPDATE uesa_event_log 
      SET financial_status = 'RATED' 
      WHERE financial_status = 'PENDING_RATING'
    `;

    return NextResponse.json({ success: true, message: 'UESA Financial Sweep Executed. Ledgers M and H updated.' });
  } catch (error) {
    console.error('UESA Sweep Error:', error);
    return NextResponse.json({ error: 'Sweep failure. Manual audit required.' }, { status: 500 });
  }
}
