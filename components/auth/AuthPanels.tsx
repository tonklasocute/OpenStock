import Link from "next/link";
import React from "react";
import { ChevronUp } from "lucide-react";
import Logo from "@/components/Logo";

export const AuthLeftPanel = ({ children }: { children: React.ReactNode }) => (
    <section className="auth-left-section scrollbar-hide-default">
        <Link href="/" className="auth-logo inline-block">
            <Logo size={36} />
        </Link>
        <div className="pb-6 lg:pb-8 flex-1">
            {children}
        </div>
    </section>
);

export const MarketOverviewPanel = () => (
    <section className="auth-right-section" style={{ justifyContent: 'space-between' }}>
        <span className="tag tag-outline self-start">MARKET OVERVIEW</span>

        <div className="flex flex-col gap-0.5">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">AAPL</div>
            <div className="text-[44px] font-extrabold text-gray-100 leading-none">$268.40</div>
            <div className="tag tag-accent w-fit mt-1">
                <ChevronUp className="w-3.5 h-3.5 mr-1" />
                +1.8%
            </div>
            <svg viewBox="0 0 260 70" width="100%" height="70" className="mt-4">
                <defs>
                    <linearGradient id="auth-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#ec3013" stopOpacity="0.25" />
                        <stop offset="1" stopColor="#ec3013" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d="M0 50 L30 45 L60 55 L90 30 L120 38 L150 20 L180 28 L210 10 L240 18 L260 5 L260 70 L0 70 Z" fill="url(#auth-area)" />
                <path d="M0 50 L30 45 L60 55 L90 30 L120 38 L150 20 L180 28 L210 10 L240 18 L260 5" fill="none" stroke="#ec3013" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>

        <p className="text-sm text-gray-400 max-w-[340px]">
            ติดตามหุ้นที่ชอบ ตั้งแจ้งเตือนราคา ดูข้อมูลเชิงลึก — ฟรี ไม่มีค่าสมัครสมาชิก
        </p>
    </section>
);

export const AuthShell = ({ children }: { children: React.ReactNode }) => (
    <>
        <AuthLeftPanel>{children}</AuthLeftPanel>
        <MarketOverviewPanel />
    </>
);
