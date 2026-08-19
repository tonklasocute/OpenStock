import crypto from 'crypto';

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '';
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET ?? '';

export const hasLineConfig = Boolean(CHANNEL_ACCESS_TOKEN && CHANNEL_SECRET);

if (!hasLineConfig) {
    console.warn('⚠️ LINE credentials are not configured. LINE notifications are disabled until LINE_CHANNEL_ACCESS_TOKEN and LINE_CHANNEL_SECRET are set.');
}

export function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!signatureHeader || !CHANNEL_SECRET) return false;
    const hash = crypto.createHmac('sha256', CHANNEL_SECRET).update(rawBody).digest('base64');
    return hash === signatureHeader;
}

type SendResult = { status: 'sent' | 'skipped' | 'failed' };

export async function replyMessage(replyToken: string, text: string): Promise<SendResult> {
    if (!hasLineConfig) {
        console.warn('⚠️ LINE reply skipped: credentials are not configured.');
        return { status: 'skipped' };
    }
    try {
        const res = await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({ replyToken, messages: [{ type: 'text', text }] }),
        });
        if (!res.ok) {
            console.error('LINE reply failed:', res.status, await res.text());
            return { status: 'failed' };
        }
        return { status: 'sent' };
    } catch (error) {
        console.error('LINE reply error:', error);
        return { status: 'failed' };
    }
}

export async function pushMessage(lineUserId: string, text: string): Promise<SendResult> {
    if (!hasLineConfig) {
        console.warn('⚠️ LINE push skipped: credentials are not configured.');
        return { status: 'skipped' };
    }
    try {
        const res = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({ to: lineUserId, messages: [{ type: 'text', text }] }),
        });
        if (!res.ok) {
            console.error('LINE push failed:', res.status, await res.text());
            return { status: 'failed' };
        }
        return { status: 'sent' };
    } catch (error) {
        console.error('LINE push error:', error);
        return { status: 'failed' };
    }
}
