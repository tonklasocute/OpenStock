import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/line/client', () => ({
    verifySignature: vi.fn(),
    replyMessage: vi.fn(),
}));
vi.mock('@/database/mongoose', () => ({
    connectToDatabase: vi.fn(),
}));
vi.mock('@/database/models/lineLink.model', () => ({
    LineLink: { findOne: vi.fn() },
}));

afterEach(() => {
    vi.clearAllMocks();
});

describe('POST /api/line/webhook', () => {
    it('rejects a request with an invalid signature before touching the database', async () => {
        const { verifySignature } = await import('@/lib/line/client');
        const { connectToDatabase } = await import('@/database/mongoose');
        vi.mocked(verifySignature).mockReturnValue(false);

        const { POST } = await import('@/app/api/line/webhook/route');
        const request = new NextRequest('http://localhost/api/line/webhook', {
            method: 'POST',
            body: '{"events":[]}',
            headers: { 'x-line-signature': 'bad-signature' },
        });

        const response = await POST(request);

        expect(response.status).toBe(401);
        expect(connectToDatabase).not.toHaveBeenCalled();
    });

    it('links the account when a valid unexpired code matches', async () => {
        const { verifySignature, replyMessage } = await import('@/lib/line/client');
        const { LineLink } = await import('@/database/models/lineLink.model');
        vi.mocked(verifySignature).mockReturnValue(true);

        const save = vi.fn();
        vi.mocked(LineLink.findOne).mockResolvedValue({
            linkCode: '123456',
            linkCodeExpiresAt: new Date(Date.now() + 60_000),
            save,
        } as any);

        const { POST } = await import('@/app/api/line/webhook/route');
        const request = new NextRequest('http://localhost/api/line/webhook', {
            method: 'POST',
            body: JSON.stringify({
                events: [
                    {
                        type: 'message',
                        replyToken: 'reply-token',
                        message: { type: 'text', text: '123456' },
                        source: { userId: 'U123' },
                    },
                ],
            }),
            headers: { 'x-line-signature': 'good-signature' },
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(save).toHaveBeenCalled();
        expect(replyMessage).toHaveBeenCalledWith('reply-token', expect.any(String));
    });

    it('ignores a message whose text does not match any pending code', async () => {
        const { verifySignature, replyMessage } = await import('@/lib/line/client');
        const { LineLink } = await import('@/database/models/lineLink.model');
        vi.mocked(verifySignature).mockReturnValue(true);
        vi.mocked(LineLink.findOne).mockResolvedValue(null);

        const { POST } = await import('@/app/api/line/webhook/route');
        const request = new NextRequest('http://localhost/api/line/webhook', {
            method: 'POST',
            body: JSON.stringify({
                events: [
                    {
                        type: 'message',
                        replyToken: 'reply-token',
                        message: { type: 'text', text: 'not-a-code' },
                        source: { userId: 'U123' },
                    },
                ],
            }),
            headers: { 'x-line-signature': 'good-signature' },
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(replyMessage).not.toHaveBeenCalled();
    });
});
