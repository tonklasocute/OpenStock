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
    return pushMessages(lineUserId, [text]);
}

const LINE_MAX_MESSAGE_LENGTH = 5000;
const LINE_MAX_MESSAGES_PER_PUSH = 5;

// Splits text into chunks under LINE's per-message character limit,
// preferring to break on line boundaries so a price/news line never splits mid-way.
export function splitMessage(text: string, maxLength: number = LINE_MAX_MESSAGE_LENGTH): string[] {
    if (text.length <= maxLength) return [text];

    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > maxLength) {
        let splitAt = remaining.lastIndexOf('\n', maxLength);
        if (splitAt <= 0) splitAt = maxLength;
        chunks.push(remaining.slice(0, splitAt));
        remaining = remaining.slice(splitAt).replace(/^\n+/, '');
    }
    if (remaining.length > 0) chunks.push(remaining);
    return chunks;
}

// LINE's push endpoint accepts up to 5 message objects per call.
export async function pushMessages(lineUserId: string, texts: string[]): Promise<SendResult> {
    if (!hasLineConfig) {
        console.warn('⚠️ LINE push skipped: credentials are not configured.');
        return { status: 'skipped' };
    }
    try {
        const messages = texts.slice(0, LINE_MAX_MESSAGES_PER_PUSH).map((text) => ({ type: 'text', text }));
        const res = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({ to: lineUserId, messages }),
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
