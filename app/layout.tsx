import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import {Toaster} from "@/components/ui/sonner";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

export const metadata: Metadata = {
  title: "tonklasocute",
  description: "tonklasocute is a free stock tracking app. Track real-time prices, set personalized alerts, and explore detailed company insights — no paywalls, no subscriptions.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${archivo.variable} antialiased`}
            >
                {children}
                <Toaster/>
                <Analytics />
            </body>
        </html>
    );
}
