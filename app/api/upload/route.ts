import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    // 1. Capture ALL files, not just the first one
    const files = formData.getAll('files') as File[];
    const ticketId = formData.get('ticketId') as string || 'NO-TICKET';
    const contactInfo = formData.get('contactInfo') as string || 'Anonymous / Not Provided';

    // 2. Guardrail for empty payloads
    if (files.length === 0 && (!contactInfo || contactInfo === 'Anonymous / Not Provided')) {
      return NextResponse.json({ error: 'Empty payload. Provide a file or contact info.' }, { status: 400 });
    }

    // 3. Generate Deterministic Timestamp
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day} ${hours}:${minutes}`;

    let message = `🚨 ZTHIX RADAR PING 🚨\n\n🕒 Time: ${timestamp}\n👤 Contact: ${contactInfo}\n`;
    let uploadSuccessCount = 0;

    // 4. Sequential Multi-File Upload Loop
    if (files.length > 0) {
      message += `🎫 Ticket: ${ticketId}\n📦 Payload Count: ${files.length} file(s)\n\n`;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 0) {
          const secureFilename = `${timestamp} ${ticketId} - ${file.name}`;
          
          // Force 'attachment' to prevent browser inline expansion (forces download to Mac)
          const blob = await put(secureFilename, file, { 
            access: 'public',
            contentDisposition: `attachment; filename="${secureFilename}"`
          });
          
          message += `📄 File ${i + 1}: ${secureFilename}\n[⬇️ FORCE DOWNLOAD LINK](${blob.url})\n\n`;
          uploadSuccessCount++;
        }
      }
    } else {
      message += `\n⚠️ STATUS: Passive Lead / Subscription. No payload attached.`;
    }

    // 5. Transmit Radar Ping to Telegram
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

    return NextResponse.json({ success: true, count: uploadSuccessCount, message: 'Transmission logged.' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Transmission failed at the edge node.' }, { status: 500 });
  }
}
