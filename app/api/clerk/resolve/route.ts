import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { ticketId, clerkId, projectType, outcome, passcode } = await request.json();

    // The Front Door Guard. Do not leak this passcode. 
    // This prevents malicious internet scrapers from injecting fake resolutions.
    if (passcode !== 'ZTHIX-ALPHA-777') {
      return NextResponse.json({ error: 'Unauthorized payload.' }, { status: 403 });
    }

    if (!ticketId || !clerkId || !projectType || !outcome) {
      return NextResponse.json({ error: 'Incomplete parameter matrix.' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is severed.');
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Construct the UESA standard action string (e.g., 'HUMAN_RESOLUTION_GREEN')
    const dbAction = `HUMAN_RESOLUTION_${outcome}`;

    // Inject the immutable record into the Event Log
    await sql`
      INSERT INTO uesa_event_log (actor_id, action, resource_id, project_type, context_payload)
      VALUES (
        ${clerkId}, 
        ${dbAction}, 
        ${ticketId}, 
        ${projectType}, 
        ${JSON.stringify({ status: outcome, timestamp: new Date().toISOString() })}::jsonb
      )
    `;

    return NextResponse.json({ success: true, message: 'Resolution locked into UESA Ledger.' });
  } catch (error) {
    console.error('UESA Clerk API Error:', error);
    return NextResponse.json({ error: 'Ledger injection failed.' }, { status: 500 });
  }
}
