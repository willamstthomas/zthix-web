import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const ticketId = formData.get('ticketId') as string || 'NO-TICKET';
    const contactInfo = formData.get('contactInfo') as string || 'Anonymous / Not Provided';

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

    let message = `🚨 ZTHIX RADAR PING 🚨\n\n🕒 Time: ${timestamp}\n👤 Contact: ${contactInfo}\n`;

    if (file && file.size > 0) {
      const secureFilename = `${timestamp} ${ticketId} - ${file.name}`;
      
      // Clean, compliant storage injection
      const blob = await put(secureFilename, file, { 
        access: 'public'
      });
      
      // Appending ?download=1 to force the hard download to your Mac
      message += `🎫 Ticket: ${ticketId}\n📁 Payload: ${file.name}\n\n[⬇️ SECURE DOWNLOAD LINK](${blob.url}?download=1)`;
    } else {
      message += `\n⚠️ STATUS: Passive Lead. No payload attached.`;
    }

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

    return NextResponse.json({ success: true, message: 'Transmission logged.' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Transmission failed at the edge node.' }, { status: 500 });
  }
}
