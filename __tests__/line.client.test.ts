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
