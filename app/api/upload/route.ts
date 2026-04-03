import { put } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const ticketId = formData.get('ticketId') as string || 'NO-TICKET';
    const contactInfo = formData.get('contactInfo') as string || 'Anonymous / Not Provided';
    const projectType = formData.get('projectType') as string || 'OPSCORE';

    if ((!file || file.size === 0) && (!contactInfo || contactInfo === 'Anonymous / Not Provided')) {
      return NextResponse.json({ error: 'Empty payload.' }, { status: 400 });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day} ${hours}:${minutes}`;

    let message = `🚨 ZTHIX RADAR PING 🚨\n\n🛡️ Project: ${projectType}\n🕒 Time: ${timestamp}\n👤 Contact: ${contactInfo}\n`;
    let fileUrl = 'No File';
    let payloadName = 'Passive Lead';

    if (file && file.size > 0) {
      payloadName = file.name;
      const secureFilename = `${timestamp} ${ticketId} - ${file.name}`;
      
      const blob = await put(secureFilename, file, { access: 'public' });
      fileUrl = `${blob.url}?download=1`;
      
      message += `🎫 Ticket: ${ticketId}\n📁 Payload: ${file.name}\n\n[⬇️ SECURE DOWNLOAD LINK](${fileUrl})`;
    } else {
      message += `\n⚠️ STATUS: Passive Lead. No payload attached.`;
    }

    // --- UESA LEDGER INJECTION VIA NEON NATIVE DRIVER ---
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is missing.');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    const dbAction = file && file.size > 0 ? `${projectType}_UPLOAD_SUCCESS` : `${projectType}_PASSIVE_LEAD`;
    const contextPayload = JSON.stringify({ filename: payloadName, url: fileUrl });
    
    await sql`
      INSERT INTO uesa_event_log (actor_id, action, resource_id, project_type, context_payload)
      VALUES (${contactInfo}, ${dbAction}, ${ticketId}, ${projectType}, ${contextPayload}::jsonb)
    `;

    // --- TELEGRAM RADAR ---
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });

    return NextResponse.json({ success: true, message: 'Transmission logged to UESA Ledger.' });
  } catch (error) {
    console.error('UESA API Error:', error);
    return NextResponse.json({ error: 'Transmission failed at the edge node.' }, { status: 500 });
  }
}
