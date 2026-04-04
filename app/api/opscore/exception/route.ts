import { put } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sei = formData.get('sei') as string;
    const uid = formData.get('uid') as string; 
    const riskLevel = formData.get('riskLevel') as string; 
    const projectType = formData.get('projectType') as string || 'OPSCORE';

    if (!file || !uid || !sei) {
      return NextResponse.json({ error: 'Missing critical cryptographic payloads.' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL severed.');
    
    // 1. UPLOAD TO THE CLOUD VAULT
    const blob = await put(`exceptions/${uid}-${file.name}`, file, {
      access: 'public',
    });

    // 2. WRITE TO THE MASTER LEDGER
    const sql = neon(process.env.DATABASE_URL);

    // If GREEN, bypass queue. If YELLOW/RED, lock in queue.
    const queueStatus = riskLevel === 'GREEN' ? 'COMPLETED' : 'PENDING_CLERK';

    await sql`
      INSERT INTO uesa_event_log
      (actor_id, action, resource_id, project_type, cloud_storage_url, queue_status)
      VALUES
      (${sei}, 'PENDING_RATING', ${uid}, ${projectType}, ${blob.url}, ${queueStatus})
    `;

    return NextResponse.json({
      success: true,
      uid: uid,
      url: blob.url,
      queue_status: queueStatus,
      message: 'Payload secured in Cloud Vault and locked in Ledger.'
    });

  } catch (error) {
    console.error('Cloud Ingestion Error:', error);
    return NextResponse.json({ error: 'Fatal ingestion failure.' }, { status: 500 });
  }
}
