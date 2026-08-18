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
                <p className="text-base font-semibold" style={{ color: '#831843' }}>
                    ติดตามหุ้นที่ชอบ ตั้งแจ้งเตือนราคา ดูข้อมูลเชิงลึก — ฟรี ไม่มีค่าสมัครสมาชิก
                </p>
                <div className="bg-white rounded-2xl p-5 w-full max-w-xs text-left shadow-lg">
                    <div className="text-[11px] font-semibold tracking-wide mb-2" style={{ color: '#9d174d' }}>
                        MARKET OVERVIEW
                    </div>
                    <svg viewBox="0 0 260 70" width="100%" height="70">
                        <defs>
                            <linearGradient id="auth-area" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="#f472b6" stopOpacity="0.35" />
                                <stop offset="1" stopColor="#f472b6" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d="M0 50 L30 45 L60 55 L90 30 L120 38 L150 20 L180 28 L210 10 L240 18 L260 5 L260 70 L0 70 Z" fill="url(#auth-area)" />
                        <path d="M0 50 L30 45 L60 55 L90 30 L120 38 L150 20 L180 28 L210 10 L240 18 L260 5" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex justify-between mt-2">
                        <div>
                            <div className="text-[11px] text-gray-500">AAPL</div>
                            <div className="text-sm font-bold text-gray-100">$268.40</div>
                        </div>
                        <div className="text-xs font-bold self-end" style={{ color: '#16a34a' }}>+1.8%</div>
                    </div>
                </div>
            </section>

        </main>
    )
}
export default Layout
