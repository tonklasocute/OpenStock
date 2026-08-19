import { afterEach, describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';

afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
    delete process.env.LINE_CHANNEL_SECRET;
});

describe('verifySignature', () => {
    it('returns true for a correctly signed body', async () => {
        process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-token';
        process.env.LINE_CHANNEL_SECRET = 'test-secret';
        const { verifySignature } = await import('@/lib/line/client');

        const body = '{"events":[]}';
        const signature = crypto.createHmac('sha256', 'test-secret').update(body).digest('base64');

        expect(verifySignature(body, signature)).toBe(true);
    });

    it('returns false for a tampered body', async () => {
        process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-token';
        process.env.LINE_CHANNEL_SECRET = 'test-secret';
        const { verifySignature } = await import('@/lib/line/client');

        const signature = crypto.createHmac('sha256', 'test-secret').update('{"events":[]}').digest('base64');

        expect(verifySignature('{"events":[{"tampered":true}]}', signature)).toBe(false);
    });

    it('returns false when the signature header is missing', async () => {
        process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-token';
        process.env.LINE_CHANNEL_SECRET = 'test-secret';
        const { verifySignature } = await import('@/lib/line/client');

        expect(verifySignature('{"events":[]}', null)).toBe(false);
    });
});

describe('pushMessage', () => {
    it('sends a push message and returns sent on success', async () => {
        process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-token';
        process.env.LINE_CHANNEL_SECRET = 'test-secret';
        const { pushMessage } = await import('@/lib/line/client');

        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));

        const result = await pushMessage('U123', 'hello');
        expect(result).toEqual({ status: 'sent' });
    });

    it('returns skipped when LINE credentials are not configured', async () => {
        const { pushMessage } = await import('@/lib/line/client');

        const fetchSpy = vi.spyOn(global, 'fetch');
        const result = await pushMessage('U123', 'hello');

        expect(result).toEqual({ status: 'skipped' });
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('returns failed when LINE responds with a non-2xx status', async () => {
        process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-token';
        process.env.LINE_CHANNEL_SECRET = 'test-secret';
        const { pushMessage } = await import('@/lib/line/client');

        vi.spyOn(global, 'fetch').mockResolvedValue(new Response('bad request', { status: 400 }));

        const result = await pushMessage('U123', 'hello');
        expect(result).toEqual({ status: 'failed' });
    });
});

describe('splitMessage', () => {
    it('returns the text unchanged in a single-element array when under the limit', async () => {
        const { splitMessage } = await import('@/lib/line/client');

        expect(splitMessage('short text')).toEqual(['short text']);
    });

    it('splits on the nearest newline before the limit, not mid-line', async () => {
        const { splitMessage } = await import('@/lib/line/client');

        const line = 'A'.repeat(10);
        const text = Array(500).fill(line).join('\n'); // ~5499 chars, well past a small limit

        const chunks = splitMessage(text, 100);

        expect(chunks.length).toBeGreaterThan(1);
        for (const chunk of chunks) {
            expect(chunk.length).toBeLessThanOrEqual(100);
            // every chunk boundary lands on a full line, never mid-"AAAAAAAAAA"
            for (const part of chunk.split('\n')) {
                expect(part === '' || part === line).toBe(true);
            }
        }
        expect(chunks.join('\n')).toBe(text);
    });

    it('falls back to a hard split when a single line exceeds the limit', async () => {
        const { splitMessage } = await import('@/lib/line/client');

        const text = 'B'.repeat(250);
        const chunks = splitMessage(text, 100);

        expect(chunks).toEqual(['B'.repeat(100), 'B'.repeat(100), 'B'.repeat(50)]);
    });
});

describe('pushMessages', () => {
    it('sends multiple text messages in one push call', async () => {
        process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-token';
        process.env.LINE_CHANNEL_SECRET = 'test-secret';
        const { pushMessages } = await import('@/lib/line/client');

        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));

        const result = await pushMessages('U123', ['part one', 'part two']);

        expect(result).toEqual({ status: 'sent' });
        const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
        expect(body.messages).toEqual([
            { type: 'text', text: 'part one' },
            { type: 'text', text: 'part two' },
        ]);
    });

    it('caps at 5 messages per push call, per LINE limits', async () => {
        process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-token';
        process.env.LINE_CHANNEL_SECRET = 'test-secret';
        const { pushMessages } = await import('@/lib/line/client');

        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));

        await pushMessages('U123', ['1', '2', '3', '4', '5', '6', '7']);

        const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
        expect(body.messages).toHaveLength(5);
    });
});
