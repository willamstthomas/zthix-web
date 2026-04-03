import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://zthix-opscore.vercel.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { clerkId, clientId, projectType, outcome, passcode } = payload;
    
    const ticketIds: string[] = payload.ticketIds || (payload.ticketId ? [payload.ticketId] : []);

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

    for (const tid of ticketIds) {
      // 1. FORGE THE ANCHOR: Tie the UID to the Client SEI so the Sweep Engine can bill it
      if (clientId) {
        await sql`
          INSERT INTO uesa_event_log (actor_id, action, resource_id, project_type, context_payload)
          VALUES (
            ${clientId}, 
            'PENDING_RATING', 
            ${tid}, 
            ${projectType}, 
            ${JSON.stringify({ origin: 'factory_direct_batch' })}::jsonb
          )
        `;
      }

      // 2. LOCK THE RESOLUTION: Log the clerk's labor
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
      message: `Batch Resolution Locked. ${ticketIds.length} UIDs secured to SEI ${clientId || 'UNKNOWN'}.` 
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('UESA Clerk Batch API Error:', error);
    return NextResponse.json({ error: 'Ledger batch injection failed.' }, { status: 500, headers: corsHeaders });
  }
}
