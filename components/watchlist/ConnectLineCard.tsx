"use client";

import React, { useState } from "react";
import { generateLinkCode, getLineLinkStatus } from "@/lib/actions/line.actions";

interface ConnectLineCardProps {
    userId: string;
    initiallyConnected: boolean;
}

export default function ConnectLineCard({ userId, initiallyConnected }: ConnectLineCardProps) {
    const [connected, setConnected] = useState(initiallyConnected);
    const [code, setCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const lineOaId = process.env.NEXT_PUBLIC_LINE_OA_ID;

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await generateLinkCode();
            setCode(result.linkCode);
        } catch {
            setCode(null);
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshStatus = async () => {
        const status = await getLineLinkStatus();
        setConnected(status.connected);
    };

    if (connected) {
        return (
            <div className="bg-gray-900 rounded-none p-3 border border-gray-600 mb-4 text-sm text-gray-100">
                🔔 เชื่อมต่อ LINE แล้ว ✓
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-none p-3 border border-gray-600 mb-4">
            <div className="text-sm font-semibold text-gray-100 mb-2">เชื่อมต่อ LINE เพื่อรับแจ้งเตือน</div>
            {code ? (
                <div className="space-y-2">
                    <p className="text-xs text-gray-400">
                        1. Add เพื่อน LINE OA{lineOaId ? (
                            <>
                                {' '}(
                                <a
                                    href={`https://line.me/R/ti/p/${lineOaId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-teal-500 hover:underline"
                                >
                                    {lineOaId}
                                </a>
                                )
                            </>
                        ) : null}
                        <br />
                        2. พิมพ์ส่งรหัสนี้ในแชท: <span className="font-mono font-bold text-teal-500">{code}</span> (หมดอายุใน 10 นาที)
                    </p>
                    <button
                        onClick={handleRefreshStatus}
                        className="text-xs text-teal-500 hover:underline"
                    >
                        เช็คสถานะ
                    </button>
                </div>
            ) : (
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="text-xs bg-teal-500 hover:bg-teal-600 text-gray-900 px-3 py-1.5 rounded-none font-medium disabled:opacity-50"
                >
                    {loading ? 'กำลังสร้างรหัส...' : 'สร้างรหัสเชื่อมต่อ'}
                </button>
            )}
        </div>
    );
}
