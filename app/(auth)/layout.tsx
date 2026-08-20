import Link from "next/link";
import React from "react";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {auth} from "@/lib/better-auth/auth";
import Logo from "@/components/Logo";

const Layout = async ({ children }: { children : React.ReactNode }) => {

    const session = await auth.api.getSession({headers: await headers()});

    if (session?.user) redirect('/')
    return (
        <main className="auth-layout">
            <section className="auth-left-section scrollbar-hide-default">
                <Link href="/" className="auth-logo flex items-center gap-2">
                    <Logo size={40} />
                </Link>

                <div className="pb-6 lg:pb-8 flex-1">
                    {children}
                </div>
            </section>
            <section className="auth-right-section flex flex-col items-center justify-center gap-6 text-center px-8">
                <Logo size={64} showWordmark={false} />
                <p className="text-base font-semibold text-gray-400">
                    ติดตามหุ้นที่ชอบ ตั้งแจ้งเตือนราคา ดูข้อมูลเชิงลึก — ฟรี ไม่มีค่าสมัครสมาชิก
                </p>
                <div className="bg-gray-800 border-2 border-gray-600 rounded-none p-5 w-full max-w-xs text-left">
                    <span className="inline-block text-[11px] font-semibold tracking-wide mb-3 border border-teal-500 text-teal-500 px-2 py-0.5">
                        MARKET OVERVIEW
                    </span>
                    <svg viewBox="0 0 260 70" width="100%" height="70">
                        <defs>
                            <linearGradient id="auth-area" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="#ec3013" stopOpacity="0.25" />
                                <stop offset="1" stopColor="#ec3013" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d="M0 50 L30 45 L60 55 L90 30 L120 38 L150 20 L180 28 L210 10 L240 18 L260 5 L260 70 L0 70 Z" fill="url(#auth-area)" />
                        <path d="M0 50 L30 45 L60 55 L90 30 L120 38 L150 20 L180 28 L210 10 L240 18 L260 5" fill="none" stroke="#ec3013" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex justify-between mt-2">
                        <div>
                            <div className="text-[11px] text-gray-500">AAPL</div>
                            <div className="text-sm font-bold text-gray-100">$268.40</div>
                        </div>
                        <div className="text-xs font-bold self-end text-teal-500">+1.8%</div>
                    </div>
                </div>
            </section>

        </main>
    )
}
export default Layout
