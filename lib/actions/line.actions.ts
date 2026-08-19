'use server';

import { connectToDatabase } from '@/database/mongoose';
import { LineLink } from '@/database/models/lineLink.model';

function generateSixDigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function generateLinkCode(userId: string) {
    try {
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

export async function getLineLinkStatus(userId: string) {
    try {
        await connectToDatabase();
        const link = await LineLink.findOne({ userId });
        return { connected: Boolean(link?.lineUserId) };
    } catch (error) {
        console.error('Error fetching LINE link status:', error);
        return { connected: false };
    }
}
