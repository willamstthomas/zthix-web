import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const ticketId = formData.get('ticketId') as string || 'NO-TICKET';
    const contactInfo = formData.get('contactInfo') as string || 'Anonymous / Not Provided';

    // 1. Guardrail: If the payload is completely empty, reject it.
    if ((!file || file.size === 0) && (!contactInfo || contactInfo === 'Anonymous / Not Provided')) {
      return NextResponse.json({ error: 'Empty payload. Provide a file or contact info.' }, { status: 400 });
    }

    // 2. Generate Deterministic Timestamp (YYYYMMDD HH:MM)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day} ${hours}:${minutes}`;

    let blobUrl = null;
    let secureFilename = 'None';
    let message = `🚨 ZTHIX RADAR PING 🚨\n\n🕒 Time: ${timestamp}\n👤 Contact: ${contactInfo}\n`;

    // 3. Conditional Storage Logic
    if (file && file.size > 0) {
      secureFilename = `${timestamp} ${ticketId} - ${file.name}`;
      const blob = await put(secureFilename, file, { access: 'public' });
      blobUrl = blob.url;
      
      message += `🎫 Ticket: ${ticketId}\n📁 File: ${secureFilename}\n\n[⬇️ SECURE DOWNLOAD LINK](${blobUrl})`;
    } else {
      message += `\n⚠️ STATUS: Passive Lead / Subscription. No payload attached.`;
    }

    // 4. Transmit Radar Ping to Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });

    return NextResponse.json({ success: true, url: blobUrl, message: 'Transmission logged.' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Transmission failed at the edge node.' }, { status: 500 });
  }
}
