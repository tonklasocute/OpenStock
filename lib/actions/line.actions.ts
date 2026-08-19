'use server';

import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { connectToDatabase } from '@/database/mongoose';
import { LineLink } from '@/database/models/lineLink.model';

function generateSixDigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function requireUserId(): Promise<string> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new Error('Unauthorized');
    }
    return session.user.id;
}

export async function generateLinkCode() {
    try {
        const userId = await requireUserId();
        await connectToDatabase();
        const linkCode = generateSixDigitCode();
        const linkCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await LineLink.findOneAndUpdate(
            { userId },
            { linkCode, linkCodeExpiresAt },
            { upsert: true, new: true }
        );

        return { linkCode, expiresAt: linkCodeExpiresAt.toISOString() };
    } catch (error) {
        console.error('Error generating LINE link code:', error);
        throw new Error('Failed to generate LINE link code');
    }
}

export async function getLineLinkStatus() {
    try {
        const userId = await requireUserId();
        await connectToDatabase();
        const link = await LineLink.findOne({ userId });
        return { connected: Boolean(link?.lineUserId) };
    } catch (error) {
        console.error('Error fetching LINE link status:', error);
        return { connected: false };
    }
}
