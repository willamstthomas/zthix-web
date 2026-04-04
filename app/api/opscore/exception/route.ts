import { put } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

// 1. INJECT THE SHIELD-LOWERING PROTOCOL (CORS)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 2. HANDLE THE BROWSER'S PREFLIGHT RADAR PING
export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: corsHeaders });
}

// 3. THE MAIN INGESTION ENGINE
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sei = formData.get('sei') as string;
    const uid = formData.get('uid') as string; 
    const riskLevel = formData.get('riskLevel') as string; 
    const projectType = formData.get('projectType') as string || 'OPSCORE';

    if (!file || !uid || !sei) {
      return NextResponse.json(
        { error: 'Missing critical cryptographic payloads.' }, 
        { status: 400, headers: corsHeaders }
      );
    }

    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL severed.');
    
    // A. UPLOAD TO THE CLOUD VAULT
    const blob = await put(`exceptions/${uid}-${file.name}`, file, {
      access: 'public',
    });

 // B. WRITE TO THE MASTER LEDGER
    const sql = neon(process.env.DATABASE_URL);
    const queueStatus = riskLevel === 'GREEN' ? 'COMPLETED' : 'PENDING_CLERK';

    // INJECTED 'content' COLUMN TO SATISFY POSTGRESQL NOT NULL CONSTRAINT
    // Stripped strict ::jsonb cast to ensure universal compatibility
    await sql`
      INSERT INTO uesa_event_log
      (actor_id, action, resource_id, project_type, cloud_storage_url, queue_status, content)
      VALUES
      (${sei}, 'PENDING_RATING', ${uid}, ${projectType}, ${blob.url}, ${queueStatus}, '{}')
    `;

    return NextResponse.json({
      success: true,
      uid: uid,
      url: blob.url,
      queue_status: queueStatus,
      message: 'Payload secured in Cloud Vault and locked in Ledger.'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Cloud Ingestion Error:', error);
    return NextResponse.json(
      { error: 'Fatal ingestion failure.' }, 
      { status: 500, headers: corsHeaders }
    );
  }
}
