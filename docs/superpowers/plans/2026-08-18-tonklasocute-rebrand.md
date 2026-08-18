# tonklasocute Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand this OpenStock fork into "tonklasocute" — new name, new mascot
logo, light pastel-pink theme everywhere (including the previously-dark
Watchlist feature) — while keeping AGPL-required credit to the upstream
project and removing third-party sponsor/promo content that doesn't apply to
this fork.

**Architecture:** Two layers of change. (1) A single-file color-token swap in
`app/globals.css` that automatically reskins ~300 Tailwind-class usages
site-wide (`bg-gray-900`, `text-teal-400`, etc.). (2) A per-file sweep of
literal hardcoded colors (`text-white`, `bg-black`, `bg-[#0A0A0A]`,
`border-white/10`, etc.) that bypass the token system and would otherwise
render invisible or wrong after the swap — these need individual fixes using
a consistent rule table (defined below).

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS v4 (`@theme` tokens in
`app/globals.css`), TypeScript, no new dependencies.

## Global Constraints

- Product name in all user-facing text: **tonklasocute** (lowercase).
- No new npm dependencies — the logo is inline SVG, no image-generation tooling used.
- Keep a small AGPL credit line in the footer: "Built with OpenStock · Open
  Dev Society", linking to `https://github.com/Open-Dev-Society/OpenStock`.
- Don't touch README.md, API_DOCS.md, MARKET_SUPPORT.md, or LICENSE.
- No browser screenshot tooling is available in this environment — every
  task's verification step uses `curl` + `grep` against the running dev
  server (or `npx tsc --noEmit` for authenticated pages `curl` can't reach
  past the sign-in redirect), not a visual screenshot.
- **Color rule table** (apply throughout; referenced as "the rule table" in
  later tasks):

  | Old (literal, breaks after the token swap) | New | When |
  |---|---|---|
  | `text-white` | `text-gray-100` | heading/value text on a plain card/page surface |
  | `text-white` | *(leave unchanged)* | text sits on an explicit saturated/colored background (`bg-destructive`, a red/green status pill, a `teal-400`/`teal-500` gradient button) — white-on-color is correct in both themes |
  | `bg-black` (solid) | `bg-gray-900` | full-bleed page/section background |
  | `bg-black/NN`, `from-black`, `to-black` (translucent "glass" panel) | `bg-white/NN'` where `NN'` is `NN` raised (e.g. `/40`→`/70`, `/20`→`/60`) | inverted glass direction: a light frosted card instead of a dark one |
  | `border-white/NN` | `border-black/NN` | inverted subtle-border direction |
  | `bg-white/5`, `bg-white/10` (hover highlight) | `bg-black/5`, `bg-black/10` | inverted hover-highlight direction |
  | `divide-white/10` | `divide-black/10` | inverted row-divider direction |
  | `bg-[#0A0A0A]` / `bg-[#1C1C1F]` paired with `border-gray-800` | `bg-white` (or `bg-gray-900` for a paler inset) paired with `border-gray-600` | hardcoded near-black surfaces → white surface with a visible pink border (token `border-gray-800` alone would be invisible white-on-white) |
  | `from-white`/`to-white` in a `bg-clip-text` gradient heading | `from-gray-100`/`to-gray-100` | gradient text needs a dark start/end color on a light background |
  | `bg-blue-900/NN text-blue-300` (dark-mode status badge) | `bg-blue-100 text-blue-700` | light-mode badge equivalent |
  | `bg-black/50` on `components/ui/dialog.tsx` | *(leave unchanged)* | standard modal scrim, correct in both themes |

---

### Task 1: Mascot logo component + favicon

**Files:**
- Create: `components/Logo.tsx`
- Create: `app/icon.svg`

**Interfaces:**
- Produces: `Logo` (default export from `components/Logo.tsx`), props
  `{ size?: number; showWordmark?: boolean; className?: string }`. Later
  tasks import it as `import Logo from "@/components/Logo"` and use
  `<Logo />`, `<Logo showWordmark={false} size={64} />`, etc.

- [ ] **Step 1: Create the Logo component**

```tsx
// components/Logo.tsx
const Logo = ({
    size = 34,
    showWordmark = true,
    className = "",
}: {
    size?: number;
    showWordmark?: boolean;
    className?: string;
}) => {
    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
                <circle cx="17" cy="17" r="17" fill="#f472b6" />
                <circle cx="12" cy="14" r="2" fill="#fff" />
                <circle cx="22" cy="14" r="2" fill="#fff" />
                <path
                    d="M11 21 Q17 26 23 21"
                    stroke="#fff"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                />
            </svg>
            {showWordmark && (
                <span className="font-extrabold text-gray-100" style={{ fontSize: size * 0.56 }}>
                    tonklasocute
                </span>
            )}
        </span>
    );
};

export default Logo;
```

- [ ] **Step 2: Create the favicon SVG (Next.js `app/icon.svg` convention — auto-served, no code wiring needed)**

```svg
<!-- app/icon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34">
  <circle cx="17" cy="17" r="17" fill="#f472b6" />
  <circle cx="12" cy="14" r="2" fill="#fff" />
  <circle cx="22" cy="14" r="2" fill="#fff" />
  <path d="M11 21 Q17 26 23 21" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" />
</svg>
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```
Expected: no new type errors from `components/Logo.tsx`.

- [ ] **Step 4: Commit**

```bash
git add components/Logo.tsx app/icon.svg
git commit -m "Add tonklasocute mascot logo component and favicon"
```

---

### Task 2: Global theme tokens, identity metadata, TradingView light mode

**Files:**
- Modify: `app/globals.css:114-131` (the custom `@theme` block)
- Modify: `app/layout.tsx` (metadata + `<html>` class)
- Modify: `package.json:2` (`"name"` field)
- Modify: `lib/constants.ts` (8 occurrences of `colorTheme: 'dark'`)

**Interfaces:**
- Consumes: nothing (foundational task).
- Produces: the retheme every later task assumes is already in place — after
  this task, `bg-gray-900/800/700/600/500/400/300/200/100` and
  `text-teal-400/500` resolve to the light pastel-pink palette everywhere.

- [ ] **Step 1: Replace the custom color tokens in `app/globals.css`**

Find this block (currently lines 114–131):

```css
@theme {
    /* Extended Gray Scale */
    --color-gray-900: #050505;
    --color-gray-800: #141414;
    --color-gray-700: #212328;
    --color-gray-600: #30333A;
    --color-gray-500: #9095A1;
    --color-gray-400: #CCDADC;

    /* Vibrant Colors */
    --color-blue-600: #5862FF;
    --color-yellow-400: #FDD458;
    --color-yellow-500: #E8BA40;
    --color-teal-400: #0FEDBE;
    --color-red-500: #FF495B;
    --color-orange-500: #FF8243;
    --color-purple-500: #D13BFF;
}
```

Replace it with:

```css
@theme {
    /* Extended Gray Scale — light pastel-pink theme */
    --color-gray-900: #FDF2F8;
    --color-gray-800: #FFFFFF;
    --color-gray-700: #FCE7F3;
    --color-gray-600: #FBCFE8;
    --color-gray-500: #6B7280;
    --color-gray-400: #1F2937;
    --color-gray-300: #374151;
    --color-gray-200: #111827;
    --color-gray-100: #0B0F19;

    /* Vibrant Colors */
    --color-blue-600: #5862FF;
    --color-yellow-400: #FDD458;
    --color-yellow-500: #E8BA40;
    --color-teal-400: #F472B6;
    --color-teal-500: #EC4899;
    --color-red-500: #FF495B;
    --color-orange-500: #FF8243;
    --color-purple-500: #D13BFF;
}
```

(`--color-teal-500` didn't exist as its own entry before — it silently
reused `--color-teal-400`'s value via Tailwind's default teal-500 fallback.
Defining it explicitly now is required so buttons/hovers get the two-tone
pink gradient from the approved mockup instead of a flat single pink.)

- [ ] **Step 2: Remove the hardcoded dark-mode class and update metadata in `app/layout.tsx`**

```tsx
// Before:
export const metadata: Metadata = {
  title: "OpenStock",
  description: "OpenStock is an open-source alternative to expensive market platforms. Track real-time prices, set personalized alerts, and explore detailed company insights — built openly, for everyone, forever free.",
};
```
```tsx
// After:
export const metadata: Metadata = {
  title: "tonklasocute",
  description: "tonklasocute is a free stock tracking app. Track real-time prices, set personalized alerts, and explore detailed company insights — no paywalls, no subscriptions.",
};
```

```tsx
// Before:
        <html lang="en" className="dark">
```
```tsx
// After:
        <html lang="en">
```

- [ ] **Step 3: Rename the package in `package.json`**

```json
// Before:
  "name": "Openstock",
```
```json
// After:
  "name": "tonklasocute",
```

- [ ] **Step 4: Flip all 8 TradingView widget configs in `lib/constants.ts` to light mode**

```bash
sed -i '' "s/colorTheme: 'dark'/colorTheme: 'light'/g" lib/constants.ts
```

- [ ] **Step 5: Verify — build succeeds and the token file has the new values**

```bash
grep -c "colorTheme: 'light'" lib/constants.ts   # expect: 8
grep "color-gray-900" app/globals.css             # expect: #FDF2F8
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add app/globals.css app/layout.tsx package.json lib/constants.ts
git commit -m "Retheme to light pastel-pink palette and rename product to tonklasocute"
```

---

### Task 3: Header, Footer, remove third-party promo components

**Files:**
- Modify: `components/Header.tsx`
- Modify: `components/Footer.tsx`
- Delete: `components/OpenDevSocietyBranding.tsx`
- Delete: `components/DonatePopup.tsx`
- Delete: `components/SirayBanner.tsx`
- Modify: `components/NavItems.tsx`
- Modify: `app/(root)/layout.tsx`

**Interfaces:**
- Consumes: `Logo` from Task 1 (`import Logo from "@/components/Logo"`).

- [ ] **Step 1: Swap the logo in `components/Header.tsx`**

```tsx
// Before:
import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import {searchStocks} from "@/lib/actions/finnhub.actions";
```
```tsx
// After:
import Link from "next/link";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import Logo from "@/components/Logo";
import {searchStocks} from "@/lib/actions/finnhub.actions";
```

```tsx
// Before:
                <Link href="/" className="flex items-center justify-center gap-2">
                    <Image
                        src="/assets/images/logo.png"
                        alt="OpenStock"
                        width={200}
                        height={50}
                    />
                </Link>
```
```tsx
// After:
                <Link href="/" className="flex items-center justify-center gap-2">
                    <Logo />
                </Link>
```

- [ ] **Step 2: Rewrite the brand section and credit line in `components/Footer.tsx`**

```tsx
// Before:
import Link from "next/link";
import Image from "next/image";
import OpenDevSocietyBranding from "./OpenDevSocietyBranding";
```
```tsx
// After:
import Link from "next/link";
import Logo from "@/components/Logo";
```

```tsx
// Before:
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <Image
                                src="/assets/images/logo.png"
                                alt="OpenStock"
                                width={150}
                                height={38}
                                className="brightness-0 invert"
                            />
                        </Link>
                        <p className="text-gray-400 mb-6 max-w-md">
                            OpenStock is an open-source alternative to expensive market platforms. Track real-time prices, set personalized alerts, and explore detailed company insights — built openly, for everyone, forever free.
                        </p>
                        <div className="mb-8">
                            <Link href="/about" className="text-teal-400 hover:text-teal-300 font-medium inline-flex items-center gap-1 group">
                                Learn about our mission
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                        </div>
                        <div className="flex space-x-6">
                            <Link
                                href="https://github.com/Open-Dev-Society/OpenStock"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors duration-200 relative group"
                            >
                                <span className="relative">
                                    GitHub
                                    <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                                </span>
                            </Link>
                            <Link
                                href="https://www.linkedin.com/company/opendevsociety-in/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-blue-400 transition-colors duration-200 relative group"
                            >
                                <span className="relative">
                                    LinkedIn
                                    <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
                                </span>
                            </Link>
                            <Link
                                href="https://discord.gg/JkJ8kfxgxB"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-blue-600 transition-colors duration-200 relative group"
                            >
                                <span className="relative">
                                    Discord
                                    <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                                </span>
                            </Link>
                        </div>
                    </div>
```
```tsx
// After:
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <Logo />
                        </Link>
                        <p className="text-gray-400 mb-6 max-w-md">
                            tonklasocute is a free stock tracking app. Track real-time prices, set personalized alerts, and explore detailed company insights — no paywalls, no subscriptions.
                        </p>
                    </div>
```

```tsx
// Before:
                        {/* Copyright */}
                        <div className="text-gray-400 text-sm mb-4 md:mb-0">
                            © {new Date().getFullYear()} Open Dev Society. All rights reserved.
                        </div>

                        {/* Open Dev Society Branding */}
                        <div className="flex items-center space-x-2">
                            <OpenDevSocietyBranding />
                        </div>
```
```tsx
// After:
                        {/* Copyright + AGPL credit */}
                        <div className="text-gray-400 text-sm">
                            © {new Date().getFullYear()} tonklasocute · Built with{' '}
                            <Link
                                href="https://github.com/Open-Dev-Society/OpenStock"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-gray-200"
                            >
                                OpenStock
                            </Link>
                            {' '}· Open Dev Society
                        </div>
```

- [ ] **Step 3: Delete the now-unused branding component**

```bash
git rm components/OpenDevSocietyBranding.tsx
```

- [ ] **Step 4: Delete the Donate popup component and its trigger UI**

```bash
git rm components/DonatePopup.tsx
```

In `components/NavItems.tsx`, remove the donate context/button (the popup
that listened for its dispatched event no longer exists, so the button
would do nothing if left in):

```tsx
// Before:
import React, { createContext, useContext } from 'react'
import {NAV_ITEMS} from "@/lib/constants";
import Link from "next/link";
import {usePathname} from "next/navigation";
import SearchCommand from "@/components/SearchCommand";
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Create context for popup state
const DonatePopupContext = createContext<{
    openDonatePopup: () => void;
}>({
    openDonatePopup: () => {}
});

export const useDonatePopup = () => useContext(DonatePopupContext);

const NavItems = ({initialStocks}: { initialStocks: StockWithWatchlistStatus[]}) => {
    const pathname = usePathname()

    const isActive = (path: string) => {
        if (path ==='/') return pathname === '/'

        return  pathname.startsWith(path);
    }

    const openDonatePopup = () => {
        // Trigger the popup by dispatching a custom event
        window.dispatchEvent(new CustomEvent('open-donate-popup'));
    }

    return (
        <DonatePopupContext.Provider value={{ openDonatePopup }}>
            <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium">
            {NAV_ITEMS.map(({href, label}) => {
                if (href === '/search') return (
                    <li key="search-trigger">
                        <SearchCommand
                            renderAs="text"
                            label="Search"
                            initialStocks={initialStocks}
                        />
                    </li>
                )
                return <li key={href}>
                    <Link href={href} className={`hover:text-teal-500 transition-colors ${isActive(href) ? 'text-gray-100' : ''}`}>
                        {label}
                    </Link>
                </li>
            })}
            <li key="donate">
                <Button
                    onClick={openDonatePopup}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2 animate-pulse"
                    size="sm"
                >
                    <Heart className="h-4 w-4 fill-current" />
                    Donate
                </Button>
            </li>
        </ul>
        </DonatePopupContext.Provider>
    )
}
export default NavItems
```
```tsx
// After:
import React from 'react'
import {NAV_ITEMS} from "@/lib/constants";
import Link from "next/link";
import {usePathname} from "next/navigation";
import SearchCommand from "@/components/SearchCommand";

const NavItems = ({initialStocks}: { initialStocks: StockWithWatchlistStatus[]}) => {
    const pathname = usePathname()

    const isActive = (path: string) => {
        if (path ==='/') return pathname === '/'

        return  pathname.startsWith(path);
    }

    return (
        <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium">
            {NAV_ITEMS.map(({href, label}) => {
                if (href === '/search') return (
                    <li key="search-trigger">
                        <SearchCommand
                            renderAs="text"
                            label="Search"
                            initialStocks={initialStocks}
                        />
                    </li>
                )
                return <li key={href}>
                    <Link href={href} className={`hover:text-teal-500 transition-colors ${isActive(href) ? 'text-gray-100' : ''}`}>
                        {label}
                    </Link>
                </li>
            })}
        </ul>
    )
}
export default NavItems
```

- [ ] **Step 5: Delete the Siray sponsor banner and its usage**

```bash
git rm components/SirayBanner.tsx
```

In `app/(root)/layout.tsx`:

```tsx
// Before:
import Header from "@/components/Header";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import DonatePopup from "@/components/DonatePopup";
import SirayBanner from "@/components/SirayBanner";
```
```tsx
// After:
import Header from "@/components/Header";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
```

```tsx
// Before:
    return (
        <main className="min-h-screen text-gray-400">
            <SirayBanner />
            <Header user={user} />

            <div className="container py-10">
                {children}
            </div>

            <Footer />
            <DonatePopup />
        </main>
    )
```
```tsx
// After:
    return (
        <main className="min-h-screen text-gray-400">
            <Header user={user} />

            <div className="container py-10">
                {children}
            </div>

            <Footer />
        </main>
    )
```

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
lsof -ti:3000 -sTCP:LISTEN | xargs -r kill; sleep 1
npm run dev > /tmp/tonklasocute-dev.log 2>&1 &
for i in $(seq 1 20); do curl -sf http://localhost:3000/sign-in >/dev/null && break; sleep 1; done
curl -s http://localhost:3000/sign-in | grep -c "tonklasocute"
```
Expected: `tsc` reports no new errors; the dev server boots; the sign-in page
HTML contains "tonklasocute" (from the header rendered inside the auth
layout in the next task — if this count is 0 before Task 4 lands, that's
expected, the header logo wordmark is what Task 3 adds sitewide via
`components/Header.tsx`, which only renders on `(root)` routes, not on
`(auth)` routes yet).

- [ ] **Step 7: Commit**

```bash
git add components/Header.tsx components/Footer.tsx components/NavItems.tsx app/\(root\)/layout.tsx
git rm components/OpenDevSocietyBranding.tsx components/DonatePopup.tsx components/SirayBanner.tsx
git commit -m "Rebrand header/footer, drop third-party sponsor promos"
```

---

### Task 4: Auth pages (sign-in, sign-up, forgot-password, reset-password)

**Files:**
- Modify: `app/(auth)/layout.tsx`
- Modify: `app/(auth)/sign-in/page.tsx`
- Modify: `app/(auth)/sign-up/page.tsx`
- Modify: `app/(auth)/forgot-password/page.tsx`
- Modify: `app/(auth)/reset-password/ResetPasswordForm.tsx`

**Interfaces:**
- Consumes: `Logo` from Task 1.

- [ ] **Step 1: Replace the auth layout's logo and right-panel content in `app/(auth)/layout.tsx`**

```tsx
// Before:
import Link from "next/link";
import React from "react";
import Image from "next/image";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {auth} from "@/lib/better-auth/auth";

const Layout = async ({ children }: { children : React.ReactNode }) => {

    const session = await auth.api.getSession({headers: await headers()});

    if (session?.user) redirect('/')
    return (
        <main className="auth-layout">
            <section className="auth-left-section scrollbar-hide-default">
                <Link href="/" className="auth-logo flex items-center gap-2">
                    <Image src="/assets/images/logo.png" alt="Openstock" width={200} height={50}/>
                </Link>

                <div className="pb-6 lg:pb-8 flex-1">
                    {children}
                </div>
            </section>
            <section className="auth-right-section">
                <div className="z-10 relative lg:mt-4 lg:mb-16">
                    <blockquote className="auth-blockquote">
                        “For me, OpenStock isn’t just another stock app. It’s about giving people clarity and control in the market, without barriers or subscriptions.”
                    </blockquote>
                    <div className="flex items-center justify-between">
                        <div>
                            <cite className="auth-testimonial-author">- Ravi Pratap Singh (@ravixalgorithm)</cite>
                            <p className="max-md:text-xs text-gray-500">Founder @opendevsociety</p>
                        </div>
                        <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map((star) => (
                                <Image src="/assets/icons/star.svg" alt="star" key={star} width={20} height={20} className="w-4 h-4"/>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex-1 relative">
                    <Image src="/assets/images/dashboard.png" alt="Dashboard Preview" width={1440} height={1150} className="auth-dashboard-preview absolute top-0" />
                </div>
            </section>

        </main>
    )
}
export default Layout
```
```tsx
// After:
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
```

- [ ] **Step 2: Remove the branding/Peerlist block from `app/(auth)/sign-in/page.tsx`**

```tsx
// Before:
import OpenDevSocietyBranding from "@/components/OpenDevSocietyBranding";
import React from "react";
```
```tsx
// After:
import React from "react";
```

```tsx
// Before:
                <FooterLink text="Don't have an account?" linkText="Create an account" href="/sign-up" />
                <OpenDevSocietyBranding outerClassName="mt-10 flex justify-center" />
                <div className="mt-5 flex justify-center">
                    <a href="https://peerlist.io/ravixalgorithm/project/openstock" target="_blank" rel="noreferrer">
                        <img
                            src="https://peerlist.io/api/v1/projects/embed/PRJH8OED7MBL9MGB9HRMKAKLM66KNN?showUpvote=true&theme=light"
                            alt="OpenStock"
                            style={{ width: 'auto', height: '72px' }}
                        />
                    </a>
                </div>
            </form>
```
```tsx
// After:
                <FooterLink text="Don't have an account?" linkText="Create an account" href="/sign-up" />
            </form>
```

Also update the email placeholder (cosmetic example text, currently baked
with the org's domain):

```tsx
// Before:
                    placeholder="opendevsociety@cc.cc"
```
```tsx
// After:
                    placeholder="you@example.com"
```

- [ ] **Step 3: Remove the same block from `app/(auth)/sign-up/page.tsx`**

```tsx
// Before:
import OpenDevSocietyBranding from "@/components/OpenDevSocietyBranding";
import React from "react";
```
```tsx
// After:
import React from "react";
```

```tsx
// Before:
                <FooterLink text="Already have an account?" linkText="Sign in" href="/sign-in" />

                <OpenDevSocietyBranding outerClassName="mt-10 flex justify-center" />
                <div className="mt-5 flex justify-center">
                    <a href="https://peerlist.io/ravixalgorithm/project/openstock" target="_blank" rel="noreferrer">
                        <img
                            src="https://peerlist.io/api/v1/projects/embed/PRJH8OED7MBL9MGB9HRMKAKLM66KNN?showUpvote=true&theme=light"
                            alt="OpenStock"
                            style={{ width: 'auto', height: '72px' }}
                        />
                    </a>
                </div>
            </form>
```
```tsx
// After:
                <FooterLink text="Already have an account?" linkText="Sign in" href="/sign-in" />
            </form>
```

```tsx
// Before:
                    placeholder="opendevsociety@cc.cc"
```
```tsx
// After:
                    placeholder="you@example.com"
```

- [ ] **Step 4: Remove the branding line from `app/(auth)/forgot-password/page.tsx`**

```tsx
// Before:
import OpenDevSocietyBranding from '@/components/OpenDevSocietyBranding';
```
Delete that line entirely (no replacement import needed).

```tsx
// Before:
                <FooterLink text="Remembered it?" linkText="Sign in" href="/sign-in" />
                <OpenDevSocietyBranding outerClassName="mt-10 flex justify-center" />
            </form>
```
```tsx
// After:
                <FooterLink text="Remembered it?" linkText="Sign in" href="/sign-in" />
            </form>
```

```tsx
// Before:
                    placeholder="opendevsociety@cc.cc"
```
```tsx
// After:
                    placeholder="you@example.com"
```

- [ ] **Step 5: Remove the branding line from `app/(auth)/reset-password/ResetPasswordForm.tsx`**

```tsx
// Before:
import OpenDevSocietyBranding from '@/components/OpenDevSocietyBranding';
```
Delete that line entirely.

```tsx
// Before:
                <FooterLink text="Need a fresh link?" linkText="Request another one" href="/forgot-password" />
                <OpenDevSocietyBranding outerClassName="mt-10 flex justify-center" />
            </form>
```
```tsx
// After:
                <FooterLink text="Need a fresh link?" linkText="Request another one" href="/forgot-password" />
            </form>
```

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
curl -s http://localhost:3000/sign-in | grep -c "tonklasocute"
curl -s http://localhost:3000/sign-in | grep -ic "ravixalgorithm\|peerlist\|opendevsociety@cc.cc"
```
Expected: first count ≥ 1 (wordmark now renders via `Logo`); second count is
`0` (no leftover testimonial/Peerlist/placeholder references).

- [ ] **Step 7: Commit**

```bash
git add "app/(auth)/layout.tsx" "app/(auth)/sign-in/page.tsx" "app/(auth)/sign-up/page.tsx" "app/(auth)/forgot-password/page.tsx" "app/(auth)/reset-password/ResetPasswordForm.tsx"
git commit -m "Rebrand auth pages: new logo, drop testimonial and Peerlist badge"
```

---

### Task 5: Homepage — remove Peerlist embed

**Files:**
- Modify: `app/(root)/page.tsx`

- [ ] **Step 1: Remove the Peerlist upvote section**

```tsx
// Before:
            </section>
            <div className="w-full flex flex-col items-center justify-center mt-8 gap-4">
                <h2 className="text-xl font-semibold text-gray-200">Upvote us on Peerlist 🚀</h2>
                <a href="https://peerlist.io/ravixalgorithm/project/openstock" target="_blank" rel="noreferrer">
                    <img
                        src="https://peerlist.io/api/v1/projects/embed/PRJH8OED7MBL9MGB9HRMKAKLM66KNN?showUpvote=true&theme=light"
                        alt="OpenStock"
                        style={{ width: "auto", height: "72px" }}
                    />
                </a>
            </div>
        </div>
```
```tsx
// After:
            </section>
        </div>
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
curl -s http://localhost:3000/sign-in | grep -c "tonklasocute"  # sanity, unaffected page
grep -c "peerlist" -i "app/(root)/page.tsx"
```
Expected: last grep returns `0`.

- [ ] **Step 3: Commit**

```bash
git add "app/(root)/page.tsx"
git commit -m "Remove Peerlist promo embed from homepage"
```

---

### Task 6: Terms and Help pages — product name + color fixes

**Files:**
- Modify: `app/(root)/terms/page.tsx`
- Modify: `app/(root)/help/page.tsx`

- [ ] **Step 1: `app/(root)/terms/page.tsx` — metadata, body copy, headings, contact link**

```tsx
// Before:
export const metadata: Metadata = {
  title: 'Terms of Service | OpenStock',
```
```tsx
// After:
export const metadata: Metadata = {
  title: 'Terms of Service | tonklasocute',
```

```tsx
// Before:
        <h1 className="text-4xl md:text-5xl font-bold text-white">Terms of Service</h1>
```
```tsx
// After:
        <h1 className="text-4xl md:text-5xl font-bold text-gray-100">Terms of Service</h1>
```

```tsx
// Before:
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
```
```tsx
// After:
          <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
```

```tsx
// Before:
          <h2 className="text-2xl font-bold text-white mb-6">Community Rules</h2>
```
```tsx
// After:
          <h2 className="text-2xl font-bold text-gray-100 mb-6">Community Rules</h2>
```

```tsx
// Before:
                **OpenStock is an educational and analysis tool, not a financial advisor.**
```
```tsx
// After:
                **tonklasocute is an educational and analysis tool, not a financial advisor.**
```

```tsx
// Before:
            Questions about these terms? Email us at <a href="mailto:opendevsociety@gmail.com" className="text-teal-400 hover:underline">opendevsociety@gmail.com</a>
```
```tsx
// After:
            {/* TODO: replace with your own contact email before deploying */}
            Questions about these terms? Email us at <a href="mailto:support@tonklasocute.com" className="text-teal-400 hover:underline">support@tonklasocute.com</a>
```

- [ ] **Step 2: `app/(root)/help/page.tsx` — metadata, body copy, headings, drop cards pointing at the upstream project's own channels**

```tsx
// Before:
export const metadata: Metadata = {
  title: 'Help Center | OpenStock',
  description: 'Community-driven support for OpenStock. No paywalls, just help.',
};
```
```tsx
// After:
export const metadata: Metadata = {
  title: 'Help Center | tonklasocute',
  description: 'Community-driven support for tonklasocute. No paywalls, just help.',
};
```

```tsx
// Before:
      question: "Is OpenStock really free forever?",
```
```tsx
// After:
      question: "Is tonklasocute really free forever?",
```

```tsx
// Before:
      {/* Quick Action Grid */}
      <div className="grid md:grid-cols-3 gap-4 mb-16">
        <HelpCard
          icon={<BookOpen className="text-teal-400" />}
          title="Read Docs"
          desc="Deep dive into features and API integration."
          link="/api-docs"
          linkText="View Documentation"
        />
        <HelpCard
          icon={<MessageCircle className="text-purple-400" />}
          title="Community Chat"
          desc="Get real-time answers from other users."
          link="https://discord.gg/JkJ8kfxgxB"
          linkText="Join Discord"
        />
        <HelpCard
          icon={<Github className="text-white" />}
          title="Report Bugs"
          desc="Found an issue? Let our developers know."
          link="https://github.com/Open-Dev-Society/OpenStock/issues"
          linkText="Open Issue"
        />
      </div>
```
```tsx
// After:
      {/* Quick Action Grid */}
      <div className="grid md:grid-cols-1 gap-4 mb-16 max-w-sm mx-auto">
        <HelpCard
          icon={<BookOpen className="text-teal-400" />}
          title="Read Docs"
          desc="Deep dive into features and API integration."
          link="/api-docs"
          linkText="View Documentation"
        />
      </div>
```

(The Discord and GitHub-issues cards pointed at the upstream Open Dev
Society project's own community channels, not anything tonklasocute has —
removed rather than left pointing at someone else's support channels.)

```tsx
// Before:
        <h1 className="text-4xl md:text-5xl font-bold text-white">How can we help?</h1>
```
```tsx
// After:
        <h1 className="text-4xl md:text-5xl font-bold text-gray-100">How can we help?</h1>
```

```tsx
// Before:
        <h2 className="text-2xl font-bold text-white border-b border-gray-800 pb-4">Frequently Asked Questions</h2>
```
```tsx
// After:
        <h2 className="text-2xl font-bold text-gray-100 border-b border-gray-800 pb-4">Frequently Asked Questions</h2>
```

```tsx
// Before:
      <div className="mt-20 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold text-white mb-2">Still stuck?</h3>
        <p className="text-gray-400 mb-6">Our team (and community) answers emails, usually entirely for free.</p>
        <a
          href="mailto:opendevsociety@gmail.com"
          className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          <Mail size={18} />
          Contact Support
        </a>
      </div>
```
```tsx
// After:
      <div className="mt-20 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold text-gray-100 mb-2">Still stuck?</h3>
        <p className="text-gray-400 mb-6">Our team (and community) answers emails, usually entirely for free.</p>
        {/* TODO: replace with your own contact email before deploying */}
        <a
          href="mailto:support@tonklasocute.com"
          className="inline-flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-600 transition-colors"
        >
          <Mail size={18} />
          Contact Support
        </a>
      </div>
```

```tsx
// Before:
      <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
```
```tsx
// After:
      <h3 className="font-bold text-gray-100 text-lg mb-2">{title}</h3>
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
curl -s http://localhost:3000/api-docs > /dev/null  # sanity unrelated page still boots
grep -ic "OpenStock\|ravixalgorithm\|discord.gg\|opendevsociety@gmail" "app/(root)/terms/page.tsx" "app/(root)/help/page.tsx"
```
Expected: `0` matches in both files.

- [ ] **Step 4: Commit**

```bash
git add "app/(root)/terms/page.tsx" "app/(root)/help/page.tsx"
git commit -m "Rebrand terms and help pages, drop links to upstream-only channels"
```

---

### Task 7: API docs page — product name + color fixes

**Files:**
- Modify: `app/(root)/api-docs/page.tsx`

- [ ] **Step 1: Metadata and hero**

```tsx
// Before:
export const metadata = {
  title: 'API & Architecture | OpenStock',
  description: 'Technical documentation for OpenStock architecture, AI integrations, and background jobs.',
};
```
```tsx
// After:
export const metadata = {
  title: 'API & Architecture | tonklasocute',
  description: 'Technical documentation for tonklasocute architecture, AI integrations, and background jobs.',
};
```

```tsx
// Before:
        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          OpenStock Architecture
        </h1>
```
```tsx
// After:
        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
          tonklasocute Architecture
        </h1>
```

- [ ] **Step 2: Fix the two `text-white` section headings**

```bash
sed -i '' 's/<h3 className="text-white font-semibold flex items-center gap-2">/<h3 className="text-gray-100 font-semibold flex items-center gap-2">/g' "app/(root)/api-docs/page.tsx"
```

- [ ] **Step 3: Fix the hardcoded near-black diagram surfaces**

```tsx
// Before:
        <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-8 flex flex-col justify-center items-center relative overflow-hidden group">
```
```tsx
// After:
        <div className="bg-white border border-gray-600 rounded-xl p-8 flex flex-col justify-center items-center relative overflow-hidden group">
```

```tsx
// Before:
              <div className="flex items-center justify-between text-sm text-gray-200 bg-black/40 p-2 rounded border border-gray-700">
```
```tsx
// After:
              <div className="flex items-center justify-between text-sm text-gray-200 bg-white/70 p-2 rounded border border-gray-600">
```

```tsx
// Before:
              <div className="flex items-center justify-between text-sm text-gray-200 bg-blue-900/20 p-2 rounded border border-blue-800/50">
```
```tsx
// After:
              <div className="flex items-center justify-between text-sm text-gray-200 bg-blue-100 p-2 rounded border border-blue-300">
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
grep -ic "OpenStock" "app/(root)/api-docs/page.tsx"
grep -c "text-white\|bg-\[#0A0A0A\]\|bg-black/40" "app/(root)/api-docs/page.tsx"
```
Expected: both `0`.

- [ ] **Step 5: Commit**

```bash
git add "app/(root)/api-docs/page.tsx"
git commit -m "Rebrand API docs page and fix hardcoded dark-mode colors"
```

---

### Task 8: About page — new intro, attribute (not rewrite) the Open Dev Society story, drop Siray partner section

**Files:**
- Modify: `app/(root)/about/page.tsx`

**Interfaces:**
- Consumes: `Logo` from Task 1.

- [ ] **Step 1: Metadata, imports**

```tsx
// Before:
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    Users,
    Globe,
    Heart,
    Code,
    Github,
    Twitter,
    Linkedin,
    ArrowRight
} from 'lucide-react';

export const metadata = {
    title: 'About Us | OpenStock',
    description: 'The story behind OpenStock and the Open Dev Society.',
};
```
```tsx
// After:
import React from 'react';
import Link from 'next/link';
import {
    Globe,
    Heart,
    Code,
    ArrowRight
} from 'lucide-react';
import Logo from '@/components/Logo';

export const metadata = {
    title: 'About Us | tonklasocute',
    description: 'What tonklasocute is, and the open-source project it is built on.',
};
```

(`Users`, `Github`, `Twitter`, `Linkedin` were imported but unused by the
JSX that remains after this task's other steps — dropped to keep the
import list accurate.)

- [ ] **Step 2: Replace the hero logo image and add a short tonklasocute intro before the existing hero copy**

```tsx
// Before:
            <section className="text-center space-y-8 pt-16 mb-20">
                <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-2xl border border-teal-500/20 backdrop-blur-sm">
                        <img src="/assets/images/logo.png" alt="Open Dev Society" className="h-10 w-auto" />
                    </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tight">
                    Tools for Everyone.
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light">
                    We believe financial intelligence shouldn't be locked behind paywalls.
                    OpenStock is built by the community, for the community.
                </p>
            </section>
```
```tsx
// After:
            <section className="text-center space-y-8 pt-16 mb-20">
                <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-2xl border border-teal-500/20 backdrop-blur-sm">
                        <Logo size={40} showWordmark={false} />
                    </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 via-gray-200 to-gray-500 tracking-tight">
                    Tools for Everyone.
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light">
                    We believe financial intelligence shouldn't be locked behind paywalls.
                    tonklasocute is free to use, with no premium tier for core features.
                </p>
            </section>
```

- [ ] **Step 3: Relabel (don't rewrite) the origin-story section as attribution to the upstream project**

```tsx
// Before:
            <section className="grid md:grid-cols-2 gap-12 items-center mb-24 bg-gray-900/30 p-8 md:p-12 rounded-3xl border border-gray-800">
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-white">The Open Dev Society</h2>
                    <p className="text-gray-400 leading-relaxed text-lg">
                        OpenStock was born from a simple frustration: why are powerful financial tools so expensive?
                    </p>
                    <p className="text-gray-400 leading-relaxed text-lg">
                        We are a collective of developers, designers, and financial enthusiasts working under the <span className="text-teal-400 font-semibold">Open Dev Society</span> banner. Our mission is to democratize software by building high-quality, open-source alternatives to proprietary platforms.
                    </p>
                    <div className="pt-4">
                        <Link href="https://github.com/Open-Dev-Society" target="_blank" className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 font-medium transition-colors group">
                            Visit our GitHub <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
                <div className="relative h-[400px] w-full bg-gradient-to-br from-gray-800 to-black rounded-2xl overflow-hidden border border-gray-700 shadow-2xl group">
                    <Image
                        src="/assets/icons/odslogo.svg"
                        alt="Open Dev Society"
                        fill
                        className="object-contain p-20 opacity-80 group-hover:scale-105 transition-transform duration-700"
                    />
                </div>
            </section>
```
```tsx
// After:
            <section className="grid md:grid-cols-2 gap-12 items-center mb-24 bg-gray-900/30 p-8 md:p-12 rounded-3xl border border-gray-800">
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-gray-100">Powered by Open Dev Society</h2>
                    <p className="text-gray-400 leading-relaxed text-lg">
                        tonklasocute is built on top of OpenStock, an open-source project that was born from a
                        simple frustration: why are powerful financial tools so expensive?
                    </p>
                    <p className="text-gray-400 leading-relaxed text-lg">
                        OpenStock is maintained by a collective of developers, designers, and financial
                        enthusiasts working under the <span className="text-teal-400 font-semibold">Open Dev Society</span> banner.
                        Their mission is to democratize software by building high-quality, open-source
                        alternatives to proprietary platforms.
                    </p>
                    <div className="pt-4">
                        <Link href="https://github.com/Open-Dev-Society/OpenStock" target="_blank" className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 font-medium transition-colors group">
                            View the OpenStock source <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
                <div className="relative h-[400px] w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl group flex items-center justify-center">
                    <Logo size={96} showWordmark={false} className="opacity-80 group-hover:scale-105 transition-transform duration-700" />
                </div>
            </section>
```

(The link target changed from the Open Dev Society org root to the
OpenStock repo specifically, and the image swapped from the org's SVG mark
to our own `Logo` — the org's `/assets/icons/odslogo.svg` is being retired
from use, not deleted, since it's still a valid credit-worthy asset the
user could reference in the future.)

- [ ] **Step 4: Remove the Siray partner section entirely (same reasoning as the Siray banner in Task 3)**

```tsx
// Before:
            {/* Team / Contributors */}
            <section className="text-center mb-20">
                <h2 className="text-3xl font-bold text-white mb-10">Backed by Amazing Partners</h2>
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="h-8 w-px bg-gray-700"></div>
                    <Link href="https://www.siray.ai" target="_blank" className="hover:opacity-100 transition-opacity flex items-center gap-2">
                        <img src="/assets/icons/siray.svg" alt="Siray" className="h-6 w-auto invert brightness-0" />
                        <span className="text-xl font-bold text-teal-500">Siray.ai</span>
                    </Link>
                    <div className="h-8 w-px bg-gray-700"></div>
                </div>
            </section>

        </div>
    );
}
```
```tsx
// After:
        </div>
    );
}
```

- [ ] **Step 5: Fix the two remaining `text-white` spots in the helper components below**

```tsx
// Before:
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
```
```tsx
// After:
            <h3 className="text-xl font-bold text-gray-100 mb-3">{title}</h3>
```

```tsx
// Before:
            className="flex items-center gap-3 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all duration-200 border border-gray-700 hover:border-gray-600 font-medium"
```
```tsx
// After:
            className="flex items-center gap-3 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-xl transition-all duration-200 border border-gray-700 hover:border-gray-600 font-medium"
```

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
grep -c "text-white\|siray\|Siray\|bg-\[#" -i "app/(root)/about/page.tsx"
```
Expected: `0`.

- [ ] **Step 7: Commit**

```bash
git add "app/(root)/about/page.tsx"
git commit -m "Rebrand about page: tonklasocute intro, attribute (not erase) OpenStock origin story, drop Siray section"
```

---

### Task 9: Watchlist page shell + CreateAlertModal — fix hardcoded dark surfaces

**Files:**
- Modify: `app/(root)/watchlist/page.tsx`
- Modify: `components/watchlist/CreateAlertModal.tsx`

- [ ] **Step 1: `app/(root)/watchlist/page.tsx` — page background and gradient heading**

```tsx
// Before:
        <div className="min-h-screen bg-black text-gray-100 p-6 md:p-8">
```
```tsx
// After:
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-8">
```

```tsx
// Before:
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
```
```tsx
// After:
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-500">
```

- [ ] **Step 2: `components/watchlist/CreateAlertModal.tsx` — replace every hardcoded near-black surface**

```tsx
// Before:
            <DialogContent className="sm:max-w-[425px] bg-[#0A0A0A] border-gray-800 text-white shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-white mb-2">Price Alert</DialogTitle>
                </DialogHeader>
```
```tsx
// After:
            <DialogContent className="sm:max-w-[425px] bg-white border-gray-600 text-gray-100 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-gray-100 mb-2">Price Alert</DialogTitle>
                </DialogHeader>
```

```tsx
// Before:
                            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all rounded-md h-10"
```
```tsx
// After:
                            className="bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-600 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all rounded-md h-10"
```

```tsx
// Before:
                                className="bg-[#1C1C1F] border-none text-gray-500 shadow-inner rounded-md h-10"
```
```tsx
// After:
                                className="bg-gray-900 border-none text-gray-500 shadow-inner rounded-md h-10"
```

```tsx
// Before:
                            <SelectTrigger className="bg-[#1C1C1F] border-gray-800 text-gray-200">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1C1C1F] border-gray-800 text-gray-200">
                                <SelectItem value="price">Price</SelectItem>
                            </SelectContent>
```
```tsx
// After:
                            <SelectTrigger className="bg-gray-900 border-gray-600 text-gray-200">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-600 text-gray-200">
                                <SelectItem value="price">Price</SelectItem>
                            </SelectContent>
```

```tsx
// Before:
                            <SelectTrigger className="bg-[#1C1C1F] border-gray-800 text-gray-200 hover:border-gray-700 transition-colors">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1C1C1F] border-gray-800 text-gray-200">
                                <SelectItem value="ABOVE">Greater than {">"}</SelectItem>
                                <SelectItem value="BELOW">Less than {"<"}</SelectItem>
                            </SelectContent>
```
```tsx
// After:
                            <SelectTrigger className="bg-gray-900 border-gray-600 text-gray-200 hover:border-gray-500 transition-colors">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-600 text-gray-200">
                                <SelectItem value="ABOVE">Greater than {">"}</SelectItem>
                                <SelectItem value="BELOW">Less than {"<"}</SelectItem>
                            </SelectContent>
```

```tsx
// Before:
                                className="pl-7 bg-[#1C1C1F] border-gray-800 text-white placeholder:text-gray-600 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all rounded-md h-10 font-mono"
```
```tsx
// After:
                                className="pl-7 bg-gray-900 border-gray-600 text-gray-100 placeholder:text-gray-600 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all rounded-md h-10 font-mono"
```

(The submit button's `bg-[#FACC15] hover:bg-[#EAB308] text-black` is left
unchanged — black text on a solid bright-yellow button is correct in both
themes, per the rule table.)

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
grep -c "bg-\[#0A0A0A\]\|bg-\[#1C1C1F\]\|bg-black\b" "app/(root)/watchlist/page.tsx" "components/watchlist/CreateAlertModal.tsx"
```
Expected: `0` in both files.

- [ ] **Step 4: Commit**

```bash
git add "app/(root)/watchlist/page.tsx" components/watchlist/CreateAlertModal.tsx
git commit -m "Fix hardcoded dark surfaces on watchlist page and alert modal"
```

---

### Task 10: Watchlist components — invert the black-glass panel styling to light

**Files:**
- Modify: `components/watchlist/WatchlistTable.tsx`
- Modify: `components/watchlist/TradingViewWatchlist.tsx`
- Modify: `components/stocks/StockSentimentCard.tsx`
- Modify: `components/watchlist/WatchlistManager.tsx`
- Modify: `components/watchlist/WatchlistStockChip.tsx`
- Modify: `components/watchlist/NewsGrid.tsx`
- Modify: `components/watchlist/AlertsPanel.tsx`
- Modify: `components/WatchlistButton.tsx`
- Modify: `components/forms/SelectField.tsx`

This task applies the rule table from Global Constraints to every
`text-white` / `bg-black` / `border-white` / `bg-white/N` (hover) /
`divide-white` instance in these files — the previous "dark glass on a
black page" look inverted to a "white frosted glass on a pale-pink page"
look.

- [ ] **Step 1: `components/watchlist/WatchlistTable.tsx`**

```tsx
// Before:
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-xl">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-white/5 text-gray-400 font-medium border-b border-white/10">
```
```tsx
// After:
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white/70 backdrop-blur-md shadow-xl">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-black/5 text-gray-400 font-medium border-b border-black/10">
```

```tsx
// Before:
                <tbody className="divide-y divide-white/10">
```
```tsx
// After:
                <tbody className="divide-y divide-black/10">
```

```tsx
// Before:
                            <tr key={stock.symbol} className="hover:bg-white/5 transition-colors group">
```
```tsx
// After:
                            <tr key={stock.symbol} className="hover:bg-black/5 transition-colors group">
```

```tsx
// Before:
                                            <div className="w-10 h-10 relative rounded-full overflow-hidden bg-white/10 shadow-sm border border-white/5">
```
```tsx
// After:
                                            <div className="w-10 h-10 relative rounded-full overflow-hidden bg-black/10 shadow-sm border border-black/5">
```

```tsx
// Before:
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold text-white shadow-sm border border-white/5">
```
```tsx
// After:
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-sm border border-black/5">
```

(This avatar-fallback circle needs a saturated fill after the token swap —
`from-gray-700 to-gray-800` would now be a barely-visible white-on-white
gradient, so it's switched to the brand pink gradient, and its `text-white`
is correctly left unchanged since it now sits on a saturated background.)

```tsx
// Before:
                                            <span className="font-semibold text-white text-base">{stock.name}</span>
```
```tsx
// After:
                                            <span className="font-semibold text-gray-100 text-base">{stock.name}</span>
```

```tsx
// Before:
                                    <span className="bg-white/5 px-2.5 py-1 rounded-md text-xs font-mono border border-white/10">
```
```tsx
// After:
                                    <span className="bg-black/5 px-2.5 py-1 rounded-md text-xs font-mono border border-black/10">
```

```tsx
// Before:
                                <td className="px-6 py-4 text-white font-medium text-base tracking-tight">
```
```tsx
// After:
                                <td className="px-6 py-4 text-gray-100 font-medium text-base tracking-tight">
```

```tsx
// Before:
                                            <button className="p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10" title="Add Alert">
```
```tsx
// After:
                                            <button className="p-2.5 rounded-full text-gray-400 hover:text-gray-100 hover:bg-black/10 transition-all border border-transparent hover:border-black/10" title="Add Alert">
```

- [ ] **Step 2: `components/watchlist/TradingViewWatchlist.tsx`**

```tsx
// Before:
            "colorTheme": "dark", // We can make this dynamic if needed
```
```tsx
// After:
            "colorTheme": "light",
```

```tsx
// Before:
        <div className="tradingview-widget-container border border-white/10 rounded-xl overflow-hidden shadow-2xl bg-black/40 backdrop-blur-md" ref={container}>
```
```tsx
// After:
        <div className="tradingview-widget-container border border-black/10 rounded-xl overflow-hidden shadow-2xl bg-white/70 backdrop-blur-md" ref={container}>
```

- [ ] **Step 3: `components/stocks/StockSentimentCard.tsx`**

```tsx
// Before:
        <section className="rounded-2xl border border-gray-800 bg-gray-950/40 p-5 backdrop-blur-sm">
```
```tsx
// After:
        <section className="rounded-2xl border border-gray-800 bg-white/60 p-5 backdrop-blur-sm">
```

```bash
sed -i '' \
  -e 's/rounded-2xl border border-gray-800 bg-black\/20 p-4 md:min-w-\[320px\]/rounded-2xl border border-gray-800 bg-white\/60 p-4 md:min-w-[320px]/' \
  -e 's/rounded-xl border border-gray-800 bg-black\/20 p-4/rounded-xl border border-gray-800 bg-white\/60 p-4/' \
  -e 's/rounded-lg border border-gray-800 bg-black\/20 p-3/rounded-lg border border-gray-800 bg-white\/60 p-3/g' \
  -e 's/text-xl font-semibold text-white/text-xl font-semibold text-gray-100/' \
  -e 's/mt-1 text-lg font-semibold text-white/mt-1 text-lg font-semibold text-gray-100/g' \
  -e 's/text-base font-semibold text-white/text-base font-semibold text-gray-100/' \
  -e 's/mt-2 text-xl font-semibold text-white/mt-2 text-xl font-semibold text-gray-100/g' \
  components/stocks/StockSentimentCard.tsx
```

- [ ] **Step 4: `components/watchlist/WatchlistManager.tsx`**

```tsx
// Before:
                        className="h-8 px-2 text-gray-400 hover:text-white hover:bg-white/10"
```
```tsx
// After:
                        className="h-8 px-2 text-gray-400 hover:text-gray-100 hover:bg-black/10"
```

- [ ] **Step 5: `components/watchlist/WatchlistStockChip.tsx`**

```tsx
// Before:
            <span className="font-semibold text-sm text-white">{symbol}</span>
```
```tsx
// After:
            <span className="font-semibold text-sm text-gray-100">{symbol}</span>
```

- [ ] **Step 6: `components/watchlist/NewsGrid.tsx`**

```tsx
// Before:
            <h2 className="text-xl font-bold text-white mb-4">Market News</h2>
```
```tsx
// After:
            <h2 className="text-xl font-bold text-gray-100 mb-4">Market News</h2>
```

```tsx
// Before:
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.related ? "bg-blue-900/50 text-blue-300" : "bg-gray-800 text-gray-400"
```
```tsx
// After:
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.related ? "bg-blue-100 text-blue-700" : "bg-gray-800 text-gray-400"
```

- [ ] **Step 7: `components/watchlist/AlertsPanel.tsx`**

```tsx
// Before:
                <h2 className="text-lg font-semibold text-white flex items-center">
```
```tsx
// After:
                <h2 className="text-lg font-semibold text-gray-100 flex items-center">
```

```tsx
// Before:
                                        <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center font-bold text-xs text-white">
```
```tsx
// After:
                                        <div className="w-8 h-8 rounded bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center font-bold text-xs text-white">
```

(Same reasoning as the WatchlistTable avatar circle: `bg-gray-700` alone is
now a very light pink, too weak a fill for a symbol-initial badge — given a
saturated brand-pink fill instead, with `text-white` correctly unchanged.)

```tsx
// Before:
                                            <div className="font-bold text-white text-sm">{alert.symbol}</div>
```
```tsx
// After:
                                            <div className="font-bold text-gray-100 text-sm">{alert.symbol}</div>
```

- [ ] **Step 8: `components/WatchlistButton.tsx`**

```tsx
// Before:
                className={`flex items-center justify-center p-2 rounded-full transition-all ${added ? "text-yellow-400 hover:bg-yellow-400/10" : "text-gray-400 hover:text-white hover:bg-white/10"} ${loading ? "opacity-50 cursor-wait" : ""}`}
```
```tsx
// After:
                className={`flex items-center justify-center p-2 rounded-full transition-all ${added ? "text-yellow-400 hover:bg-yellow-400/10" : "text-gray-400 hover:text-gray-100 hover:bg-black/10"} ${loading ? "opacity-50 cursor-wait" : ""}`}
```

- [ ] **Step 9: `components/forms/SelectField.tsx`**

```tsx
// Before:
                        <SelectContent className="bg-gray-800 border-gray-600 text-white">
```
```tsx
// After:
                        <SelectContent className="bg-gray-800 border-gray-600 text-gray-100">
```

```tsx
// Before:
                                <SelectItem key={option.value} value={option.value} className="focus:bg-gray-600 focus: text-white">
```
```tsx
// After:
                                <SelectItem key={option.value} value={option.value} className="focus:bg-gray-600 focus: text-gray-100">
```

- [ ] **Step 10: Verify — this is the highest-risk task, check thoroughly**

```bash
npx tsc --noEmit
grep -rn "text-white\|bg-black\|border-white\|divide-white" \
  components/watchlist/WatchlistTable.tsx \
  components/watchlist/TradingViewWatchlist.tsx \
  components/stocks/StockSentimentCard.tsx \
  components/watchlist/WatchlistManager.tsx \
  components/watchlist/WatchlistStockChip.tsx \
  components/watchlist/NewsGrid.tsx \
  components/watchlist/AlertsPanel.tsx \
  components/WatchlistButton.tsx \
  components/forms/SelectField.tsx
```
Expected: no output (every instance was either fixed or was already
confirmed correct-as-is per the rule table).

- [ ] **Step 11: Commit**

```bash
git add components/watchlist/WatchlistTable.tsx components/watchlist/TradingViewWatchlist.tsx components/stocks/StockSentimentCard.tsx components/watchlist/WatchlistManager.tsx components/watchlist/WatchlistStockChip.tsx components/watchlist/NewsGrid.tsx components/watchlist/AlertsPanel.tsx components/WatchlistButton.tsx components/forms/SelectField.tsx
git commit -m "Invert watchlist glass-panel styling from dark to light theme"
```

---

### Task 11: Full verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Fresh build**

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed with no errors.

- [ ] **Step 2: Boot the dev server and sweep every changed public route**

```bash
lsof -ti:3000 -sTCP:LISTEN | xargs -r kill; sleep 1
npm run dev > /tmp/tonklasocute-dev.log 2>&1 &
for i in $(seq 1 20); do curl -sf http://localhost:3000/sign-in >/dev/null && break; sleep 1; done

for route in / /sign-in /sign-up /about /terms /help /api-docs; do
  code=$(curl -s -o /tmp/route.html -w "%{http_code}" "http://localhost:3000$route")
  echo "== $route -> $code =="
  grep -ic "openstock" /tmp/route.html || true
done
```
Expected: `/sign-in`, `/sign-up` return 200; `/` returns 307 (redirects to
sign-in, same as before this rebrand — unauthenticated). `grep -ic
openstock` should be `0` on every route except the footer credit line
(which intentionally contains the word "OpenStock" once, as a link) — check
that count is exactly `1` on routes that render the footer, `0` elsewhere.

- [ ] **Step 3: Confirm the removed elements are actually gone sitewide**

```bash
grep -rn "ravixalgorithm\|peerlist.io\|siray.ai\|OpenDevSocietyBranding\|DonatePopup\|SirayBanner" app components --include="*.tsx" -i
```
Expected: no output.

- [ ] **Step 4: Report to the user**

Tell the user the dev server is running at `http://localhost:3000`, list
what changed, and ask them to eyeball it live in their own browser (per the
design spec's testing plan — no screenshot tooling is available in this
environment). Point out the two `// TODO: replace with your own contact
email` spots (`app/(root)/terms/page.tsx`, `app/(root)/help/page.tsx`) as
the one thing that still needs a real value from them before deploying.
