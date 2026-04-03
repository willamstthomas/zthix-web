import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

// --- THE CORS FIREWALL WHITELIST ---
// Explicitly authorizes the Factory Floor to inject data into the Accounting Ledger
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://zthix-opscore.vercel.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// --- PREFLIGHT HANDLER ---
// Browsers send a blank "OPTIONS" ping before the real POST to check security. We must reply 'OK'.
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// --- THE MASTER RESOLUTION ENGINE ---
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { clerkId, projectType, outcome, passcode } = payload;
    
    // BACKWARD COMPATIBILITY: Supports single ticket (Desk) or batch array (Factory)
    const ticketIds: string[] = payload.ticketIds || (payload.ticketId ? [payload.ticketId] : []);

    // Absolute perimeter defense
    if (passcode !== 'ZTHIX-ALPHA-777') {
      return NextResponse.json({ error: 'Unauthorized payload. Intrusion logged.' }, { status: 403, headers: corsHeaders });
    }

    if (!clerkId || !projectType || !outcome || ticketIds.length === 0) {
      return NextResponse.json({ error: 'Incomplete parameter matrix.' }, { status: 400, headers: corsHeaders });
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is severed.');
    }

    const sql = neon(process.env.DATABASE_URL);
    const dbAction = `HUMAN_RESOLUTION_${outcome}`;
    const timestamp = new Date().toISOString();

    // BATCH EXECUTION: Loop through the array and lock each UID into the ledger
    for (const tid of ticketIds) {
      await sql`
        INSERT INTO uesa_event_log (actor_id, action, resource_id, project_type, context_payload)
        VALUES (
          ${clerkId}, 
          ${dbAction}, 
          ${tid}, 
          ${projectType}, 
          ${JSON.stringify({ status: outcome, timestamp, batch_processed: true })}::jsonb
        )
      `;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Batch Resolution Locked. ${ticketIds.length} UIDs secured in Ledger.` 
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('UESA Clerk Batch API Error:', error);
    return NextResponse.json({ error: 'Ledger batch injection failed.' }, { status: 500, headers: corsHeaders });
  }
}
