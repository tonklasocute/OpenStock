import { NextRequest, NextResponse } from 'next/server';
import { verifySignature, replyMessage } from '@/lib/line/client';
import { connectToDatabase } from '@/database/mongoose';
import { LineLink } from '@/database/models/lineLink.model';

export async function POST(request: NextRequest) {
    const rawBody = await request.text();
    const signature = request.headers.get('x-line-signature');

    if (!verifySignature(rawBody, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const events = body.events ?? [];

    await connectToDatabase();

    for (const event of events) {
        if (event.type !== 'message' || event.message?.type !== 'text') continue;

        const code = event.message.text.trim();
        const lineUserId = event.source?.userId;
        if (!lineUserId) continue;

        const link = await LineLink.findOne({
            linkCode: code,
            linkCodeExpiresAt: { $gt: new Date() },
        });

        if (!link) continue;

        link.lineUserId = lineUserId;
        link.linkedAt = new Date();
        link.linkCode = null;
        link.linkCodeExpiresAt = null;
        await link.save();

        await replyMessage(event.replyToken, 'เชื่อมต่อสำเร็จ ✅ ตอนนี้คุณจะได้รับแจ้งเตือนราคาหุ้นผ่าน LINE แล้ว');
    }

    return NextResponse.json({ status: 'ok' });
}
