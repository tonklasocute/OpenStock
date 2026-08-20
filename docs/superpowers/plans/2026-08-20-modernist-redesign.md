# Modernist Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retheme every screen (sign in, sign up, dashboard, watchlist, stock
detail, alerts) from the current dark pastel-pink theme onto the
**Modernist** design system from `design_handoff_stock_redesign/` — flat,
gridded, near-mono red-on-white, zero border radius, 2px rules, Archivo
type — without touching backend/data logic.

**Architecture:** Three layers, applied in order. (1) A token-layer swap in
`app/globals.css` (`:root` shadcn tokens + the custom `@theme` gray/vibrant
block) plus an Archivo font swap in `app/layout.tsx` — this alone reflows
~300 existing Tailwind-class call sites (`bg-gray-900`, `text-teal-400`,
etc.) and every shadcn/Radix primitive (which derives its radius from
`--radius`). (2) A rewrite of the ~40 shared component classes in
`globals.css`'s `@layer utilities` block that the app's own markup already
calls by name (`.form-input`, `.watchlist-table`, `.alert-item`, …). (3) A
per-file sweep of literal hardcoded Tailwind utilities that bypass both
token layers (`rounded-xl`, `shadow-2xl`, `bg-gradient-to-br`,
`bg-[#FACC15]`, raw `green-400`/`red-400`, …), plus three small structural
changes the handoff specifies: sign-up's goal/risk/industry pickers become
radio/segmented/tag-chip controls, the alert condition picker becomes a
segmented control, and the watchlist page gains an All/Gainers/Losers
segmented filter.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS v4 (`@theme` tokens in
`app/globals.css`), shadcn/Radix UI primitives, TypeScript, `lucide-react`
(already installed, reused as-is), `next/font/google` (Archivo). No new
dependencies.

## Global Constraints

- Design source of truth: `design_handoff_stock_redesign/styles.css` and
  `Tonkla Redesign.dc.html` — token values below are copied verbatim from
  there.
- Zero border radius everywhere (`--radius-sm/md/lg: 0`). Never round a
  corner in restyled code.
- Single accent color `#ec3013` (`--color-accent`) — do not introduce new
  brand colors; danger/remove actions reuse the same accent per the
  handoff's mono-accent scheme.
- Dividers: 2px rules between major sections, 1px between table rows —
  matches `--color-divider` = `color-mix(in srgb, #201e1d 40%, transparent)`.
- Font: Archivo (400/600/800) for everything, headings at weight 800.
- No new npm dependencies. Reuse `lucide-react` icons as-is (already 2px
  stroke, matching the handoff's hand-authored SVG spec) — do not hand-author
  new SVG icons or add an icon library.
- No dark mode — the `.dark` CSS class and its token block are dead code
  (confirmed: nothing toggles it) and get deleted, not reworked.
- No backend/data-model changes. `investmentGoals`/`riskTolerance`/
  `preferredIndustry` stay single-value strings (`SignUpFormData` in
  `types/global.d.ts` unchanged) — Preferred Industry renders as
  single-select tag chips (one active at a time), not true multi-select,
  to avoid touching `signUpWithEmail`/the DB schema.
- No visual browser tooling in this environment. Every task's verification
  step uses `npx tsc --noEmit` plus `curl`+`grep` against the running dev
  server (same limitation and pattern as the prior rebrand plan,
  `docs/superpowers/plans/2026-08-18-tonklasocute-rebrand.md`) — not a
  screenshot. Ask the user to eyeball the result live at the end.
- **Color/value rule table** (apply throughout; referenced as "the rule
  table" in later tasks):

  | Token/class family | Old | New |
  |---|---|---|
  | `--color-gray-900` (page bg) | `#FDF2F8` | `#f3f2f2` (`--color-bg`) |
  | `--color-gray-800` (surface) | `#FFFFFF` | `#eae9e9` (`--color-surface`) |
  | `--color-gray-700` (subtle border/hover) | `#FCE7F3` | `#d7d3d3` (neutral-300) |
  | `--color-gray-600` (default border) | `#FBCFE8` | `color-mix(in srgb, #201e1d 40%, transparent)` (`--color-divider`) |
  | `--color-gray-500` (muted text) | `#6B7280` | `#7d7979` (neutral-600) |
  | `--color-gray-400` (body text) | `#1F2937` | `#201e1d` (`--color-text`) |
  | `--color-gray-300/200/100` (headings) | `#374151`/`#111827`/`#0B0F19` | `#444141`/`#2d2b2b`/`#201e1d` |
  | `--color-teal-400/500` (primary accent) | `#F472B6`/`#EC4899` | `#ec3013`/`#dd2b0f` (`--color-accent`/`accent-600`) |
  | `--color-yellow-400/500` (CTA button) | `#FDD458`/`#E8BA40` | `#ec3013`/`#dd2b0f` |
  | `--color-red-500` (danger) | `#FF495B` | `#ec3013` |
  | `rounded-*` (any radius utility) | varies | `0` — either delete the class or replace with nothing; 0-radius is also the new `--radius` token default |
  | `shadow-lg`/`shadow-xl`/`shadow-2xl`/`backdrop-blur-*` | glassy/elevated | delete — flat surfaces only, optionally a 1px border |
  | `bg-gradient-to-*` (teal/pink/yellow gradients) | two-stop gradient | solid `bg-accent`-equivalent token color |
  | `bg-[#FACC15]` and other hardcoded hex | literal hex | the matching token class (`bg-teal-500` etc., which now resolves to accent) |
  | `text-green-400`/`bg-green-500/10` (positive change) | green pill | `bg-accent-100 text-accent-800`-equivalent (`.tag-accent` pattern) + `ChevronUp` |
  | `text-red-400`/`bg-red-500/10` (negative change) | red pill | `bg-neutral-100 text-neutral-800`-equivalent (`.tag-neutral` pattern) + `ChevronDown` |

---

### Task 1: Design tokens — CSS custom properties and Archivo font

**Files:**
- Modify: `app/globals.css:1-139` (shadcn `:root`/`.dark` tokens, extended
  `@theme` gray/vibrant block)
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: nothing (foundational task).
- Produces: every later task assumes `bg-gray-900`…`100`, `text-teal-400/500`,
  `text-yellow-400/500`, `text-red-500`, the shadcn `--background`/
  `--primary`/`--radius` tokens, and `font-sans` already resolve to the
  Modernist palette/type/0-radius.

- [ ] **Step 1: Replace the shadcn `:root` tokens and delete the `.dark` block in `app/globals.css`**

Find (lines 46–113):

```css
:root {
    --radius: 0.625rem;
    --background: oklch(1 0 0);
    --foreground: oklch(0.129 0.042 264.695);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.129 0.042 264.695);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.129 0.042 264.695);
    --primary: oklch(0.208 0.042 265.755);
    --primary-foreground: oklch(0.984 0.003 247.858);
    --secondary: oklch(0.968 0.007 247.896);
    --secondary-foreground: oklch(0.208 0.042 265.755);
    --muted: oklch(0.968 0.007 247.896);
    --muted-foreground: oklch(0.554 0.046 257.417);
    --accent: oklch(0.968 0.007 247.896);
    --accent-foreground: oklch(0.208 0.042 265.755);
    --destructive: oklch(0.577 0.245 27.325);
    --border: oklch(0.929 0.013 255.508);
    --input: oklch(0.929 0.013 255.508);
    --ring: oklch(0.704 0.04 256.788);
    --chart-1: oklch(0.646 0.222 41.116);
    --chart-2: oklch(0.6 0.118 184.704);
    --chart-3: oklch(0.398 0.07 227.392);
    --chart-4: oklch(0.828 0.189 84.429);
    --chart-5: oklch(0.769 0.188 70.08);
    --sidebar: oklch(0.984 0.003 247.858);
    --sidebar-foreground: oklch(0.129 0.042 264.695);
    --sidebar-primary: oklch(0.208 0.042 265.755);
    --sidebar-primary-foreground: oklch(0.984 0.003 247.858);
    --sidebar-accent: oklch(0.968 0.007 247.896);
    --sidebar-accent-foreground: oklch(0.208 0.042 265.755);
    --sidebar-border: oklch(0.929 0.013 255.508);
    --sidebar-ring: oklch(0.704 0.04 256.788);
}

.dark {
    --background: oklch(0.129 0.042 264.695);
    --foreground: oklch(0.984 0.003 247.858);
    --card: oklch(0.208 0.042 265.755);
    --card-foreground: oklch(0.984 0.003 247.858);
    --popover: oklch(0.208 0.042 265.755);
    --popover-foreground: oklch(0.984 0.003 247.858);
    --primary: oklch(0.929 0.013 255.508);
    --primary-foreground: oklch(0.208 0.042 265.755);
    --secondary: oklch(0.279 0.041 260.031);
    --secondary-foreground: oklch(0.984 0.003 247.858);
    --muted: oklch(0.279 0.041 260.031);
    --muted-foreground: oklch(0.704 0.04 256.788);
    --accent: oklch(0.279 0.041 260.031);
    --accent-foreground: oklch(0.984 0.003 247.858);
    --destructive: oklch(0.704 0.191 22.216);
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(0.551 0.027 264.364);
    --chart-1: oklch(0.488 0.243 264.376);
    --chart-2: oklch(0.696 0.17 162.48);
    --chart-3: oklch(0.769 0.188 70.08);
    --chart-4: oklch(0.627 0.265 303.9);
    --chart-5: oklch(0.645 0.246 16.439);
    --sidebar: oklch(0.208 0.042 265.755);
    --sidebar-foreground: oklch(0.984 0.003 247.858);
    --sidebar-primary: oklch(0.488 0.243 264.376);
    --sidebar-primary-foreground: oklch(0.984 0.003 247.858);
    --sidebar-accent: oklch(0.279 0.041 260.031);
    --sidebar-accent-foreground: oklch(0.984 0.003 247.858);
    --sidebar-border: oklch(1 0 0 / 10%);
    --sidebar-ring: oklch(0.551 0.027 264.364);
}
```

Replace with (the `.dark` block is deleted, not replaced — dead code, see
Global Constraints):

```css
:root {
    --radius: 0rem;
    --background: #f3f2f2;
    --foreground: #201e1d;
    --card: #eae9e9;
    --card-foreground: #201e1d;
    --popover: #eae9e9;
    --popover-foreground: #201e1d;
    --primary: #ec3013;
    --primary-foreground: #f3f2f2;
    --secondary: #eae9e9;
    --secondary-foreground: #201e1d;
    --muted: #eae9e9;
    --muted-foreground: #7d7979;
    --accent: #fff2ef;
    --accent-foreground: #7c1405;
    --destructive: #ec3013;
    --border: color-mix(in srgb, #201e1d 40%, transparent);
    --input: color-mix(in srgb, #201e1d 40%, transparent);
    --ring: #ec3013;
    --chart-1: #ec3013;
    --chart-2: #dd2b0f;
    --chart-3: #ae1800;
    --chart-4: #7d7979;
    --chart-5: #444141;
    --sidebar: #eae9e9;
    --sidebar-foreground: #201e1d;
    --sidebar-primary: #ec3013;
    --sidebar-primary-foreground: #f3f2f2;
    --sidebar-accent: #fff2ef;
    --sidebar-accent-foreground: #7c1405;
    --sidebar-border: color-mix(in srgb, #201e1d 40%, transparent);
    --sidebar-ring: #ec3013;
}
```

- [ ] **Step 2: Replace the extended gray/vibrant `@theme` block**

Find (lines 115–139):

```css
/* === CUSTOM COLOR THEME === */
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
    --color-teal-300: #f9a8d4;
    --color-teal-600: #db2777;
    --color-red-500: #FF495B;
    --color-orange-500: #FF8243;
    --color-purple-500: #D13BFF;
}
```

Replace with:

```css
/* === MODERNIST DESIGN SYSTEM === */
@theme {
    /* Extended Gray Scale — Modernist neutral ramp */
    --color-gray-900: #f3f2f2;
    --color-gray-800: #eae9e9;
    --color-gray-700: #d7d3d3;
    --color-gray-600: color-mix(in srgb, #201e1d 40%, transparent);
    --color-gray-500: #7d7979;
    --color-gray-400: #201e1d;
    --color-gray-300: #444141;
    --color-gray-200: #2d2b2b;
    --color-gray-100: #201e1d;

    /* Accent — single mono-red accent reused for every "brand color" slot */
    --color-blue-600: #ec3013;
    --color-yellow-400: #ec3013;
    --color-yellow-500: #dd2b0f;
    --color-teal-400: #ec3013;
    --color-teal-500: #dd2b0f;
    --color-teal-300: #ff9783;
    --color-teal-600: #ae1800;
    --color-red-500: #ec3013;
    --color-orange-500: #e15b47;
    --color-purple-500: #e15b47;
}
```

- [ ] **Step 3: Swap the font in `app/layout.tsx`**

```tsx
// Before:
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import {Toaster} from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```
```tsx
// After:
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
```

```tsx
// Before:
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
```
```tsx
// After:
            <body
                className={`${archivo.variable} antialiased`}
            >
```

- [ ] **Step 4: Update the `@theme inline` font mapping in `app/globals.css`**

```css
/* Before: */
    --font-sans: var(--font-geist-sans);
    --font-mono: var(--font-geist-mono);
```
```css
/* After: */
    --font-sans: var(--font-archivo);
```

(`--font-mono` is deleted, not remapped — removing the override lets
Tailwind v4's built-in default monospace stack apply to the handful of
`font-mono` call sites, e.g. ticker symbols/prices, which is a fine look
and needs no Archivo-specific handling.)

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
grep -c "color-gray-900: #f3f2f2" app/globals.css   # expect: 1
grep -c "font-geist" app/layout.tsx app/globals.css  # expect: 0
```

- [ ] **Step 6: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "Retheme design tokens to the Modernist system, swap font to Archivo"
```

---

### Task 2: Shared component classes, group A — buttons, forms, nav, header/footer

**Files:**
- Modify: `app/globals.css` `@layer utilities` block — `.yellow-btn`,
  `.header`, `.header-wrapper`, `.auth-layout`, `.auth-left-section`,
  `.auth-right-section`, `.form-title`, `.form-label`, `.form-input`,
  `.select-trigger`, `.country-select-trigger`, `.country-select-input`,
  `.country-select-empty`, `.country-select-item`, `.footer-link`,
  `.search-text`, `.search-btn`, `.nav-list`

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: nothing new consumed by name elsewhere (existing class names,
  new declarations only).

- [ ] **Step 1: Rewrite the button/header/auth-shell/form-field classes**

```css
/* Before: */
    .yellow-btn {
        @apply h-12 cursor-pointer bg-gradient-to-b from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-gray-800 font-medium text-base rounded-lg shadow-lg disabled:opacity-50;
    }
```
```css
/* After: */
    .yellow-btn {
        @apply h-11 cursor-pointer bg-teal-500 hover:bg-teal-600 text-gray-900 font-extrabold text-sm rounded-none disabled:opacity-45;
    }
```

```css
/* Before: */
    .header {
        @apply z-50 w-full h-[70px] bg-gray-800;
    }
    .header-wrapper {
        @apply flex justify-between items-center px-6 py-4 text-gray-500;
    }
```
```css
/* After: */
    .header {
        @apply z-50 w-full h-[70px] bg-gray-900 border-b-2 border-gray-600;
    }
    .header-wrapper {
        @apply flex justify-between items-center px-6 py-4 text-gray-500;
    }
```

```css
/* Before: */
    .auth-layout {
        @apply flex flex-col justify-between lg:flex-row h-screen bg-gray-900 relative overflow-hidden;
    }
```
```css
/* After: */
    .auth-layout {
        @apply flex flex-col justify-between lg:flex-row min-h-screen bg-gray-900 relative overflow-hidden;
    }
```

```css
/* Before: */
    .auth-left-section {
        @apply w-full lg:w-[45%] lg:h-screen px-6 lg:px-16 flex flex-col overflow-y-auto;
    }
```
```css
/* After: */
    .auth-left-section {
        @apply w-full lg:w-1/2 lg:h-screen px-6 lg:px-16 flex flex-col overflow-y-auto lg:border-r-2 lg:border-gray-600;
    }
```

```css
/* Before: */
    .auth-right-section {
        @apply w-full max-lg:border-t max-lg:border-gray-600 lg:w-[55%] lg:h-screen bg-gray-800 px-6 py-4 md:p-6 lg:py-12 lg:px-18 flex flex-col justify-start;
    }
```
```css
/* After: */
    .auth-right-section {
        @apply w-full max-lg:border-t-2 max-lg:border-gray-600 lg:w-1/2 lg:h-screen bg-gray-800 px-6 py-4 md:p-6 lg:py-12 lg:px-18 flex flex-col justify-start;
    }
```

```css
/* Before: */
    .form-title {
        @apply text-4xl font-bold text-gray-400 mb-10;
    }
    .form-label {
        @apply text-sm font-medium text-gray-400;
    }
    .form-input {
        @apply h-12 px-3 py-3 text-gray-100 text-base placeholder:text-gray-500 border-gray-600  rounded-lg focus:!border-teal-500 focus:ring-0 ;
    }
    .select-trigger {
        @apply w-full !h-12 px-3 py-3 text-base border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:!border-teal-500 focus:ring-0;
    }
    .country-select-trigger {
        @apply h-12 px-3 py-3 text-base w-full justify-between font-normal border-gray-600 bg-gray-800 text-gray-400 rounded-lg focus:!border-teal-500 focus:ring-0;
    }
    .country-select-input {
        @apply !bg-gray-800 text-gray-400 border-0 border-b border-gray-600 rounded-none focus:ring-0 placeholder:text-gray-500;
    }
    .country-select-empty {
        @apply text-gray-500 py-6 text-center !bg-gray-800;
    }
    .country-select-item {
        @apply text-gray-100 cursor-pointer px-3 py-2 rounded-sm bg-gray-800 hover:!bg-gray-600;
    }
    .footer-link {
        @apply text-gray-400 font-medium hover:text-teal-400 hover:underline transition-colors;
    }
    .search-text {
        @apply cursor-pointer hover:text-teal-500;
    }
    .search-btn {
        @apply cursor-pointer px-4 py-2 w-fit flex items-center gap-2 text-sm md:text-base bg-teal-500 hover:bg-teal-500 text-black font-medium rounded;
    }
```
```css
/* After: */
    .form-title {
        @apply text-[32px] font-extrabold text-gray-400 mb-8 tracking-tight;
    }
    .form-label {
        @apply text-xs font-normal text-gray-500;
    }
    .form-input {
        @apply h-9 px-2.5 py-1.5 text-gray-400 text-sm placeholder:text-gray-500 bg-gray-800 border-gray-600 rounded-none focus:!border-teal-500 focus:ring-0;
    }
    .select-trigger {
        @apply w-full !h-9 px-2.5 py-1.5 text-sm border-gray-600 bg-gray-800 text-gray-400 rounded-none focus:!border-teal-500 focus:ring-0;
    }
    .country-select-trigger {
        @apply h-9 px-2.5 py-1.5 text-sm w-full justify-between font-normal border-gray-600 bg-gray-800 text-gray-400 rounded-none focus:!border-teal-500 focus:ring-0;
    }
    .country-select-input {
        @apply !bg-gray-800 text-gray-400 border-0 border-b border-gray-600 rounded-none focus:ring-0 placeholder:text-gray-500;
    }
    .country-select-empty {
        @apply text-gray-500 py-6 text-center !bg-gray-800;
    }
    .country-select-item {
        @apply text-gray-400 cursor-pointer px-3 py-2 rounded-none bg-gray-800 hover:!bg-gray-700;
    }
    .footer-link {
        @apply text-gray-400 font-medium hover:text-teal-500 hover:underline transition-colors;
    }
    .search-text {
        @apply cursor-pointer hover:text-teal-500;
    }
    .search-btn {
        @apply cursor-pointer px-3 py-1.5 w-fit flex items-center gap-1.5 text-sm bg-teal-500 hover:bg-teal-600 text-gray-900 font-extrabold rounded-none;
    }
```

- [ ] **Step 2: Rewrite `.nav-list`**

```css
/* Before: */
    .nav-list {
        @apply flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium;
    }
```
```css
/* After: */
    .nav-list {
        @apply flex flex-col sm:flex-row p-2 gap-3 sm:gap-8 font-medium text-sm;
    }
```

(`.nav-list` isn't currently applied to `NavItems.tsx`'s `<ul>` — that's a
pre-existing gap fixed in Task 4, not this task; this step only updates the
class definition.)

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
grep -c "rounded-lg\|rounded-2xl" app/globals.css   # expect fewer matches than before the edit (spot check, not zero — other classes touched in Task 3)
```

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "Flatten button/form/nav/auth-shell classes to Modernist tokens"
```

---

### Task 3: Shared component classes, group B — watchlist table, alerts, news, search

**Files:**
- Modify: `app/globals.css` `@layer utilities` block — `.stock-details-container`,
  `.watchlist-btn`, `.watchlist-remove`, `.watchlist-empty-container`,
  `.watchlist-empty`, `.watchlist-star`, `.empty-title`, `.empty-description`,
  `.watchlist-container`, `.watchlist`, `.watchlist-alerts`,
  `.watchlist-icon-btn`, `.watchlist-icon-added`, `.watchlist-icon`,
  `.trash-icon`, `.star-icon`, `.watchlist-title`, `.watchlist-table`,
  `.table-header-row`, `.table-header:first-child`, `.table-row`,
  `.table-cell`, `.add-alert`, `.watchlist-news`, `.news-item`, `.news-tag`,
  `.news-title`, `.news-meta`, `.news-summary`, `.news-cta`, `.alert-dialog`,
  `.alert-title`, `.alert-list`, `.alert-empty`, `.alert-item`, `.alert-name`,
  `.alert-details`, `.alert-company`, `.alert-price`, `.alert-actions`,
  `.alert-update-btn`, `.alert-delete-btn`, `.search-dialog`,
  `.search-field`, `.search-list`, `.search-list-indicator`,
  `.search-list-empty`, `.search-input`, `.search-loader`, `.search-count`,
  `.search-item`, `.search-item-link`, `.search-item-name`

**Interfaces:**
- Consumes: tokens from Task 1.

- [ ] **Step 1: Rewrite the watchlist/table/alert-badge classes**

```css
/* Before: */
    .watchlist-btn {
        @apply bg-teal-500 text-base hover:bg-teal-500 text-gray-900 w-full rounded h-11 font-semibold cursor-pointer;
    }
    .watchlist-remove {
        @apply bg-red-500! hover:bg-red-500! text-gray-900!
    }
```
```css
/* After: */
    .watchlist-btn {
        @apply bg-teal-500 text-sm hover:bg-teal-600 text-gray-900 w-full rounded-none h-9 font-extrabold cursor-pointer;
    }
    .watchlist-remove {
        @apply bg-transparent! border! border-teal-500! text-teal-500! hover:bg-gray-700!
    }
```

```css
/* Before: */
    .watchlist-table {
        @apply !relative overflow-hidden !w-full bg-gray-800 border !border-gray-600 !rounded-lg;
    }
    .table-header-row {
        @apply text-gray-400 font-medium bg-gray-700 border-b border-gray-600 hover:bg-gray-700;
    }
    .table-header:first-child {
        @apply pl-4;
    }
    .table-row {
        @apply border-b cursor-pointer text-gray-100 border-gray-600 hover:bg-gray-700/50 transition-colors;
    }
    .table-cell {
        @apply font-medium text-base
    }
```
```css
/* After: */
    .watchlist-table {
        @apply !relative overflow-hidden !w-full bg-transparent border-0 !rounded-none;
    }
    .table-header-row {
        @apply text-gray-500 font-normal uppercase text-[11px] tracking-wider bg-transparent border-b-2 border-gray-600 hover:bg-transparent;
    }
    .table-header:first-child {
        @apply pl-2;
    }
    .table-row {
        @apply border-b cursor-pointer text-gray-100 border-gray-700 hover:bg-gray-800 transition-colors;
    }
    .table-cell {
        @apply font-normal text-sm
    }
```

```css
/* Before: */
    .add-alert {
        @apply flex text-sm items-center whitespace-nowrap gap-1.5 px-3 w-fit py-2 text-teal-600 border border-teal-600/20 rounded font-medium bg-transparent hover:bg-transparent cursor-pointer transition-colors;
    }
```
```css
/* After: */
    .add-alert {
        @apply flex text-sm items-center whitespace-nowrap gap-1.5 px-3 w-fit py-2 text-teal-500 border border-teal-500 rounded-none font-medium bg-transparent hover:bg-teal-500 hover:text-gray-900 cursor-pointer transition-colors;
    }
```

- [ ] **Step 2: Rewrite the news classes**

```css
/* Before: */
    .news-item {
        @apply bg-gray-800 rounded-lg border w-full border-gray-600  p-4 duration-200 hover:border-gray-600 cursor-pointer;
    }
    .news-tag {
        @apply inline-block w-fit px-2 py-1 mb-5 rounded bg-gray-600/60 text-green-500 text-sm font-mono font-medium;
    }
    .news-title {
        @apply text-lg  font-semibold text-gray-100 leading-tight mb-3 line-clamp-2;
    }
    .news-meta {
        @apply flex items-center text-sm text-gray-500 mb-1;
    }
    .news-summary {
        @apply text-gray-400 flex-1 text-base leading-relaxed mb-3 line-clamp-3;
    }
    .news-cta {
        @apply text-sm align-bottom text-teal-500 hover:text-gray-400;
    }
```
```css
/* After: */
    .news-item {
        @apply bg-gray-800 rounded-none border w-full border-gray-700 p-4 duration-200 hover:border-teal-500 cursor-pointer;
    }
    .news-tag {
        @apply inline-block w-fit px-2 py-1 mb-4 rounded-none border border-teal-500 text-teal-500 text-[11px] uppercase tracking-wide font-medium;
    }
    .news-title {
        @apply text-base font-semibold text-gray-100 leading-tight mb-3 line-clamp-2;
    }
    .news-meta {
        @apply flex items-center text-xs text-gray-500 mb-1;
    }
    .news-summary {
        @apply text-gray-400 flex-1 text-sm leading-relaxed mb-3 line-clamp-3;
    }
    .news-cta {
        @apply text-sm align-bottom text-teal-500 hover:text-gray-400;
    }
```

- [ ] **Step 3: Rewrite the alert-dialog and alert-list classes**

```css
/* Before: */
    .alert-dialog {
        @apply bg-gray-800 border-gray-600 text-gray-400 max-w-md;
    }
    .alert-title {
        @apply text-xl font-semibold text-gray-100;
    }
    .alert-list {
        @apply overflow-y-auto w-full max-h-[911px] rounded-lg flex border border-gray-600 flex-col gap-4 bg-gray-800 p-3 flex-1;
    }
    .alert-empty {
        @apply px-6 py-8 text-center text-gray-500/50;
    }
    .alert-item {
        @apply p-4 rounded-lg bg-gray-700 border border-gray-600;
    }
    .alert-name {
        @apply mb-2 text-lg text-teal-500 font-semibold;
    }
    .alert-details {
        @apply flex border-b pb-3 items-center justify-between gap-3 mb-2;
    }
    .alert-company {
        @apply text-gray-400 text-base;
    }
    .alert-price {
        @apply text-gray-100 font-bold;
    }
    .alert-actions {
        @apply flex items-end justify-between;
    }
    .alert-update-btn {
        @apply text-gray-400 rounded-full bg-transparent hover:bg-green-500/15 cursor-pointer;
    }
    .alert-delete-btn {
        @apply text-gray-400 rounded-full hover:bg-red-600/15 bg-transparent cursor-pointer transition-colors;
    }
```
```css
/* After: */
    .alert-dialog {
        @apply bg-gray-800 border-2 border-gray-600 text-gray-400 max-w-md rounded-none;
    }
    .alert-title {
        @apply text-xl font-extrabold text-gray-100;
    }
    .alert-list {
        @apply overflow-y-auto w-full max-h-[911px] rounded-none flex border border-gray-600 flex-col gap-3 bg-gray-800 p-3 flex-1;
    }
    .alert-empty {
        @apply px-6 py-8 text-center text-gray-500/50;
    }
    .alert-item {
        @apply p-3 rounded-none bg-gray-900 border border-gray-600;
    }
    .alert-name {
        @apply mb-2 text-base text-teal-500 font-semibold;
    }
    .alert-details {
        @apply flex border-b border-gray-600 pb-3 items-center justify-between gap-3 mb-2;
    }
    .alert-company {
        @apply text-gray-400 text-sm;
    }
    .alert-price {
        @apply text-gray-100 font-bold;
    }
    .alert-actions {
        @apply flex items-end justify-between;
    }
    .alert-update-btn {
        @apply text-gray-400 rounded-none bg-transparent hover:bg-gray-700 cursor-pointer;
    }
    .alert-delete-btn {
        @apply text-gray-400 rounded-none hover:bg-gray-700 hover:text-teal-500 bg-transparent cursor-pointer transition-colors;
    }
```

- [ ] **Step 4: Rewrite the search-dialog classes**

```css
/* Before: */
    .search-dialog {
        @apply !bg-gray-800 lg:min-w-[800px] border-gray-600 fixed top-10 left-1/2 -translate-x-1/2 translate-y-10;
    }
    .search-field {
        @apply !bg-gray-800 border-b border-gray-600 relative;
    }
    .search-list {
        @apply !bg-gray-800 max-h-[400px];
    }
    .search-list-indicator {
        @apply px-5 py-2
    }
    .search-list-empty {
        @apply py-6 !bg-transparent text-center text-gray-500;
    }
    .search-input {
        @apply !bg-gray-800 border-0 text-gray-400 placeholder:text-gray-500 focus:ring-0 text-base h-14 pr-10;
    }
    .search-loader {
        @apply absolute right-12 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 animate-spin;
    }
    .search-count {
        @apply py-2 px-4 text-sm font-medium text-gray-400 bg-gray-700 border-b border-gray-700;
    }
    .search-item {
        @apply rounded-none my-3 px-1 w-full data-[selected=true]:bg-gray-600;
    }
    .search-item-link {
        @apply px-2 w-full cursor-pointer border-b border-gray-600 last:border-b-0 transition-colors flex items-center gap-3;
    }
    .search-item-name {
        @apply font-medium text-base text-gray-400;
    }
```
```css
/* After: */
    .search-dialog {
        @apply !bg-gray-800 lg:min-w-[800px] border-2 border-gray-600 rounded-none fixed top-10 left-1/2 -translate-x-1/2 translate-y-10;
    }
    .search-field {
        @apply !bg-gray-800 border-b-2 border-gray-600 relative;
    }
    .search-list {
        @apply !bg-gray-800 max-h-[400px];
    }
    .search-list-indicator {
        @apply px-5 py-2
    }
    .search-list-empty {
        @apply py-6 !bg-transparent text-center text-gray-500;
    }
    .search-input {
        @apply !bg-gray-800 border-0 text-gray-400 placeholder:text-gray-500 focus:ring-0 text-sm h-14 pr-10;
    }
    .search-loader {
        @apply absolute right-12 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 animate-spin;
    }
    .search-count {
        @apply py-2 px-4 text-xs uppercase tracking-wider font-medium text-gray-500 bg-gray-800 border-b border-gray-700;
    }
    .search-item {
        @apply rounded-none my-2 px-1 w-full data-[selected=true]:bg-gray-700;
    }
    .search-item-link {
        @apply px-2 w-full cursor-pointer border-b border-gray-700 last:border-b-0 transition-colors flex items-center gap-3;
    }
    .search-item-name {
        @apply font-medium text-sm text-gray-400;
    }
```

- [ ] **Step 5: Rewrite the remaining watchlist-shell classes**

```css
/* Before: */
    .watchlist-empty-container {
        @apply container gap-8 flex-col items-center md:mt-10 p-6 text-center;
    }
    .watchlist-empty {
        @apply flex flex-col items-center justify-center text-center;
    }
    .watchlist-star {
        @apply h-16 w-16 text-gray-500 mb-4;
    }
    .empty-title {
        @apply text-xl font-semibold text-gray-400 mb-2;
    }
    .empty-description {
        @apply text-gray-500 mb-6 max-w-md;
    }
    .watchlist-container {
        @apply flex flex-col-reverse lg:grid lg:grid-cols-3 gap-8;
    }
    .watchlist {
        @apply lg:col-span-2 space-y-8;
    }
    .watchlist-alerts {
        @apply items-start gap-6 h-full flex-col w-full lg:col-span-1;
    }
    .watchlist-icon-btn {
        @apply w-fit cursor-pointer hover:bg-transparent! text-gray-400 hover:text-teal-500;
    }
    .watchlist-icon-added {
        @apply !text-teal-500 hover:!text-teal-600;
    }
    .watchlist-icon {
        @apply w-8 h-8 rounded-full flex items-center justify-center bg-gray-700/50;
    }
    .trash-icon {
        @apply h-4 w-4 text-gray-400 hover:text-red-400;
    }
    .star-icon {
        @apply h-4 w-4;
    }
    .watchlist-title {
        @apply text-xl md:text-2xl font-bold text-gray-100;
    }
```
```css
/* After: */
    .watchlist-empty-container {
        @apply container gap-8 flex-col items-center md:mt-10 p-6 text-center;
    }
    .watchlist-empty {
        @apply flex flex-col items-center justify-center text-center;
    }
    .watchlist-star {
        @apply h-16 w-16 text-gray-500 mb-4;
    }
    .empty-title {
        @apply text-xl font-semibold text-gray-400 mb-2;
    }
    .empty-description {
        @apply text-gray-500 mb-6 max-w-md;
    }
    .watchlist-container {
        @apply flex flex-col-reverse lg:grid lg:grid-cols-3 gap-8;
    }
    .watchlist {
        @apply lg:col-span-2 space-y-8;
    }
    .watchlist-alerts {
        @apply items-start gap-6 h-full flex-col w-full lg:col-span-1;
    }
    .watchlist-icon-btn {
        @apply w-fit cursor-pointer hover:bg-transparent! text-gray-400 hover:text-teal-500;
    }
    .watchlist-icon-added {
        @apply !text-teal-500 hover:!text-teal-600;
    }
    .watchlist-icon {
        @apply w-8 h-8 rounded-none flex items-center justify-center bg-gray-700/50;
    }
    .trash-icon {
        @apply h-4 w-4 text-gray-400 hover:text-teal-500;
    }
    .star-icon {
        @apply h-4 w-4;
    }
    .watchlist-title {
        @apply text-xl md:text-2xl font-extrabold text-gray-100;
    }
```

(`.stock-details-container` is unchanged — it's a pure grid-layout utility
class with no color/radius/shadow declarations to flatten.)

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
grep -c "rounded-lg\|rounded-xl\|rounded-2xl\|shadow-lg\|shadow-xl\|backdrop-blur" app/globals.css
```
Expected: `0` (all shared-class occurrences removed by Tasks 2–3; any
remaining hits at this point would be in per-component files, addressed in
later tasks).

- [ ] **Step 7: Commit**

```bash
git add app/globals.css
git commit -m "Flatten watchlist/table/alert/news/search classes to Modernist tokens"
```

---

### Task 4: Nav chrome — Header, NavItems, Footer, UserDropdown, SearchCommand

**Files:**
- Modify: `components/NavItems.tsx`
- Modify: `components/UserDropdown.tsx`
- Modify: `components/SearchCommand.tsx` (no literal hardcoded colors —
  verify-only, no edit expected)

**Interfaces:**
- Consumes: `.nav-list`, `.header`, `.search-text`, `.search-btn`, etc. from
  Tasks 1–3 (already applied via existing class names in `Header.tsx`,
  `SearchCommand.tsx` — no markup change needed there).

- [ ] **Step 1: Apply `.nav-list` to `NavItems.tsx` and flatten the active-link state**

```tsx
// Before:
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
```
```tsx
// After:
    return (
        <ul className="nav-list">
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
                    <Link href={href} className={`hover:text-teal-500 transition-colors ${isActive(href) ? 'text-teal-500' : 'text-gray-400'}`}>
                        {label}
                    </Link>
                </li>
            })}
        </ul>
    )
```

- [ ] **Step 2: Flatten the avatar/dropdown surfaces in `UserDropdown.tsx`**

```tsx
// Before:
                <Button className="flex items-center gap-3 text-gray-4 hover:bg-gray-800 bg-gray-800">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://media.licdn.com/dms/image/v2/D560BAQGHApE1Vtq6DA/company-logo_200_200/B56ZY1OFJOGcAI-/0/1744649609317/philosopai_in_logo?e=1761782400&v=beta&t=uLNK6v7h96sXybdT42cVK0cJSZaA8KVLw8JYO5fY4oQ" />
                        <AvatarFallback className="bg-teal-500 text-teal-900 text-sm font-bold">
                            {user.name[0]}
                        </AvatarFallback>
                    </Avatar>
```
```tsx
// After:
                <Button className="flex items-center gap-3 rounded-none text-gray-4 hover:bg-gray-800 bg-gray-800">
                    <Avatar className="h-8 w-8 rounded-none">
                        <AvatarImage src="https://media.licdn.com/dms/image/v2/D560BAQGHApE1Vtq6DA/company-logo_200_200/B56ZY1OFJOGcAI-/0/1744649609317/philosopai_in_logo?e=1761782400&v=beta&t=uLNK6v7h96sXybdT42cVK0cJSZaA8KVLw8JYO5fY4oQ" />
                        <AvatarFallback className="bg-teal-500 text-gray-900 text-sm font-bold rounded-none">
                            {user.name[0]}
                        </AvatarFallback>
                    </Avatar>
```

```tsx
// Before:
                        <Avatar className="h-10 w-10">
                            <AvatarImage src="https://media.licdn.com/dms/image/v2/D560BAQGHApE1Vtq6DA/company-logo_200_200/B56ZY1OFJOGcAI-/0/1744649609317/philosopai_in_logo?e=1761782400&v=beta&t=uLNK6v7h96sXybdT42cVK0cJSZaA8KVLw8JYO5fY4oQ" />
                            <AvatarFallback className="bg-teal-500 text-yellow-900 text-sm font-bold">
                                {user.name[0]}
                            </AvatarFallback>
                        </Avatar>
```
```tsx
// After:
                        <Avatar className="h-10 w-10 rounded-none">
                            <AvatarImage src="https://media.licdn.com/dms/image/v2/D560BAQGHApE1Vtq6DA/company-logo_200_200/B56ZY1OFJOGcAI-/0/1744649609317/philosopai_in_logo?e=1761782400&v=beta&t=uLNK6v7h96sXybdT42cVK0cJSZaA8KVLw8JYO5fY4oQ" />
                            <AvatarFallback className="bg-teal-500 text-gray-900 text-sm font-bold rounded-none">
                                {user.name[0]}
                            </AvatarFallback>
                        </Avatar>
```

(`text-teal-900`/`text-yellow-900` were undefined tokens falling back to
Tailwind's stock near-black teal/yellow — replaced with the token
`text-gray-900`, which now resolves to `#f3f2f2`, correct light text on the
solid accent avatar background in both spots.)

- [ ] **Step 3: Verify — `SearchCommand.tsx` and `Footer.tsx` need no edits, confirm no hardcoded colors slipped in**

```bash
npx tsc --noEmit
grep -n "rounded-full\|rounded-xl\|rounded-2xl\|shadow-lg\|bg-\[#" components/SearchCommand.tsx components/Footer.tsx
```
Expected: no output (both files are already token-driven, confirmed during
plan research).

- [ ] **Step 4: Commit**

```bash
git add components/NavItems.tsx components/UserDropdown.tsx
git commit -m "Flatten nav chrome (NavItems, UserDropdown) to Modernist tokens"
```

---

### Task 5: Auth pages — sign-in restyle

**Files:**
- Modify: `app/(auth)/layout.tsx`

**Interfaces:**
- Consumes: `.auth-layout`/`.auth-left-section`/`.auth-right-section`/
  `.auth-logo`/`.form-title` from Tasks 1–2. `sign-in/page.tsx`,
  `sign-up/page.tsx`, `forgot-password/page.tsx`,
  `reset-password/ResetPasswordForm.tsx` need no edits in this task — they
  only reference shared classes/components already covered (verified during
  plan research: no hardcoded colors in any of the four).

- [ ] **Step 1: Restyle the right-panel "Market Overview" card from the pink-gradient SVG to the Modernist tag+accent-line treatment**

```tsx
// Before:
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
```
```tsx
// After:
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
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
grep -c "#831843\|#9d174d\|#f472b6\|#ec4899\|#16a34a" "app/(auth)/layout.tsx"
```
Expected: `0`.

- [ ] **Step 3: Commit**

```bash
git add "app/(auth)/layout.tsx"
git commit -m "Restyle auth right-panel market card to Modernist tokens"
```

---

### Task 6: Sign-up — radio group, segmented control, tag chips

**Files:**
- Create: `components/forms/RadioGroupField.tsx`
- Create: `components/forms/SegmentedField.tsx`
- Create: `components/forms/TagChipField.tsx`
- Modify: `app/(auth)/sign-up/page.tsx`
- Modify: `types/global.d.ts` (new prop types for the three components above)

**Interfaces:**
- Consumes: `.radio`/`.seg`/`.seg-opt`/`.tag`/`.tag-accent`/`.tag-neutral`
  classes (added in this task's Step 1, since the handoff's `styles.css` has
  them but the app's `globals.css` doesn't yet) and `Option` type from
  `types/global.d.ts`.
- Produces: `RadioGroupField`, `SegmentedField`, `TagChipField` — each takes
  `{ name: string; label: string; options: readonly Option[]; control:
  Control; error?: FieldError; required?: boolean }` (matching
  `SelectFieldProps`'s shape) so `sign-up/page.tsx` swaps them in as
  drop-in replacements for `SelectField`.

- [ ] **Step 1: Add the `.radio`/`.seg`/`.tag` classes to `app/globals.css`'s `@layer utilities` block** (ported from the handoff's `styles.css`, adapted to the app's Tailwind-class convention used by every other class in this file)

```css
    .radio {
        @apply inline-flex items-center gap-2 cursor-pointer text-sm text-gray-400;
    }
    .radio-dot {
        @apply w-4 h-4 flex-none rounded-full border-[1.5px] border-gray-600;
    }
    .radio input:checked + .radio-dot {
        @apply border-teal-500 bg-teal-500;
        box-shadow: inset 0 0 0 4px var(--color-gray-900);
    }
    .seg {
        @apply inline-flex overflow-hidden border border-gray-600 rounded-none w-full;
    }
    .seg-opt {
        @apply flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm cursor-pointer text-gray-400 border-l border-gray-600 first:border-l-0;
    }
    .seg-opt:has(input:checked) {
        @apply bg-teal-500 text-gray-900;
    }
    .seg-opt:not(:has(input:checked)):hover {
        @apply bg-gray-700;
    }
    .tag {
        @apply inline-flex items-center text-xs tracking-wide px-2.5 py-1 rounded-none cursor-pointer border transition-colors;
    }
    .tag-accent {
        @apply bg-teal-500 border-teal-500 text-gray-900;
    }
    .tag-neutral {
        @apply bg-transparent border-gray-600 text-gray-400 hover:border-teal-500 hover:text-teal-500;
    }
```

- [ ] **Step 2: Add prop types for the three new fields to `types/global.d.ts`**

```ts
// Before:
    type SelectFieldProps = {
        name: string;
        label: string;
        placeholder: string;
        options: readonly Option[];
        control: Control;
        error?: FieldError;
        required?: boolean;
    };
```
```ts
// After:
    type SelectFieldProps = {
        name: string;
        label: string;
        placeholder: string;
        options: readonly Option[];
        control: Control;
        error?: FieldError;
        required?: boolean;
    };

    type RadioGroupFieldProps = {
        name: string;
        label: string;
        options: readonly Option[];
        control: Control;
        error?: FieldError;
        required?: boolean;
    };

    type SegmentedFieldProps = RadioGroupFieldProps;
    type TagChipFieldProps = RadioGroupFieldProps;
```

- [ ] **Step 3: Create `components/forms/RadioGroupField.tsx`**

```tsx
import React from 'react'
import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";

const RadioGroupField = ({ name, label, options, control, error, required = false }: RadioGroupFieldProps) => {
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="form-label">{label}</Label>
            <Controller
                name={name}
                control={control}
                rules={{ required: required ? `Please select ${label.toLowerCase()}` : false }}
                render={({ field }) => (
                    <div className="flex flex-col gap-2">
                        {options.map((option) => (
                            <label key={option.value} className="radio">
                                <input
                                    type="radio"
                                    name={name}
                                    value={option.value}
                                    checked={field.value === option.value}
                                    onChange={() => field.onChange(option.value)}
                                    className="sr-only"
                                />
                                <span className="radio-dot" />
                                {option.label}
                            </label>
                        ))}
                    </div>
                )}
            />
            {error && <p className="text-red-600 text-sm">{error.message}</p>}
        </div>
    )
}
export default RadioGroupField
```

- [ ] **Step 4: Create `components/forms/SegmentedField.tsx`**

```tsx
import React from 'react'
import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";

const SegmentedField = ({ name, label, options, control, error, required = false }: SegmentedFieldProps) => {
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="form-label">{label}</Label>
            <Controller
                name={name}
                control={control}
                rules={{ required: required ? `Please select ${label.toLowerCase()}` : false }}
                render={({ field }) => (
                    <div className="seg">
                        {options.map((option) => (
                            <label key={option.value} className="seg-opt">
                                <input
                                    type="radio"
                                    name={name}
                                    value={option.value}
                                    checked={field.value === option.value}
                                    onChange={() => field.onChange(option.value)}
                                    className="sr-only"
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                )}
            />
            {error && <p className="text-red-600 text-sm">{error.message}</p>}
        </div>
    )
}
export default SegmentedField
```

- [ ] **Step 5: Create `components/forms/TagChipField.tsx`**

```tsx
import React from 'react'
import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";
import { cn } from "@/lib/utils";

const TagChipField = ({ name, label, options, control, error, required = false }: TagChipFieldProps) => {
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="form-label">{label}</Label>
            <Controller
                name={name}
                control={control}
                rules={{ required: required ? `Please select ${label.toLowerCase()}` : false }}
                render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => field.onChange(option.value)}
                                className={cn('tag', field.value === option.value ? 'tag-accent' : 'tag-neutral')}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            />
            {error && <p className="text-red-600 text-sm">{error.message}</p>}
        </div>
    )
}
export default TagChipField
```

- [ ] **Step 6: Swap the three `SelectField` calls in `app/(auth)/sign-up/page.tsx`**

```tsx
// Before:
import SelectField from "@/components/forms/SelectField";
```
```tsx
// After:
import RadioGroupField from "@/components/forms/RadioGroupField";
import SegmentedField from "@/components/forms/SegmentedField";
import TagChipField from "@/components/forms/TagChipField";
```

```tsx
// Before:
                <SelectField
                    name="investmentGoals"
                    label="Investment Goals"
                    placeholder="Select your investment goal"
                    options={INVESTMENT_GOALS}
                    control={control}
                    error={errors.investmentGoals}
                    required
                />

                <SelectField
                    name="riskTolerance"
                    label="Risk Tolerance"
                    placeholder="Select your risk level"
                    options={RISK_TOLERANCE_OPTIONS}
                    control={control}
                    error={errors.riskTolerance}
                    required
                />

                <SelectField
                    name="preferredIndustry"
                    label="Preferred Industry"
                    placeholder="Select your preferred industry"
                    options={PREFERRED_INDUSTRIES}
                    control={control}
                    error={errors.preferredIndustry}
                    required
                />
```
```tsx
// After:
                <RadioGroupField
                    name="investmentGoals"
                    label="Investment Goals"
                    options={INVESTMENT_GOALS}
                    control={control}
                    error={errors.investmentGoals}
                    required
                />

                <SegmentedField
                    name="riskTolerance"
                    label="Risk Tolerance"
                    options={RISK_TOLERANCE_OPTIONS}
                    control={control}
                    error={errors.riskTolerance}
                    required
                />

                <TagChipField
                    name="preferredIndustry"
                    label="Preferred Industry"
                    options={PREFERRED_INDUSTRIES}
                    control={control}
                    error={errors.preferredIndustry}
                    required
                />
```

- [ ] **Step 7: Verify**

```bash
npx tsc --noEmit
lsof -ti:3000 -sTCP:LISTEN | xargs -r kill; sleep 1
npm run dev > /tmp/modernist-dev.log 2>&1 &
for i in $(seq 1 20); do curl -sf http://localhost:3000/sign-up >/dev/null && break; sleep 1; done
curl -s http://localhost:3000/sign-up | grep -c 'class="radio"\|class="seg"\|class="tag'
```
Expected: `tsc` reports no new errors; the grep count is > 0 (the new
controls render server-side into the HTML — note `sign-up` is a client
component, so this confirms the classes are present in the client bundle's
initial HTML, not full interactivity, which needs a real browser to click
through).

- [ ] **Step 8: Commit**

```bash
git add app/globals.css types/global.d.ts components/forms/RadioGroupField.tsx components/forms/SegmentedField.tsx components/forms/TagChipField.tsx "app/(auth)/sign-up/page.tsx"
git commit -m "Replace sign-up dropdowns with Modernist radio/segmented/tag-chip controls"
```

---

### Task 7: Watchlist page shell — segmented All/Gainers/Losers filter

**Files:**
- Create: `lib/filterWatchlist.ts`
- Create: `__tests__/filterWatchlist.test.ts`
- Modify: `components/watchlist/WatchlistManager.tsx`
- Modify: `app/(root)/watchlist/page.tsx`

**Interfaces:**
- Produces: `filterWatchlist(items: { changePercent?: number }[], filter:
  'all' | 'gainers' | 'losers'): typeof items` from `lib/filterWatchlist.ts`
  — a pure function, no React/DOM dependency, importable by
  `WatchlistManager.tsx` (Task 8's `WatchlistTable` continues to receive
  whatever list `WatchlistManager` passes it; this task only adds filtering
  above that boundary).

This is the one piece of new client-side logic in the whole redesign (the
handoff's screen 1g "All/Gainers/Losers" filter isn't present in the app
today), so it gets a real unit test per the codebase's existing `vitest`
convention (see `__tests__/utils.test.ts` for the pattern).

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/filterWatchlist.test.ts
import { describe, expect, it } from 'vitest';
import { filterWatchlist } from '@/lib/filterWatchlist';

const items = [
    { symbol: 'AAPL', changePercent: 1.5 },
    { symbol: 'TSLA', changePercent: -2.1 },
    { symbol: 'MSFT', changePercent: 0 },
];

describe('filterWatchlist', () => {
    it('returns all items unchanged for "all"', () => {
        expect(filterWatchlist(items, 'all')).toEqual(items);
    });

    it('returns only items with a positive change for "gainers"', () => {
        expect(filterWatchlist(items, 'gainers').map((i) => i.symbol)).toEqual(['AAPL']);
    });

    it('returns only items with a negative change for "losers"', () => {
        expect(filterWatchlist(items, 'losers').map((i) => i.symbol)).toEqual(['TSLA']);
    });

    it('treats a zero change as neither a gainer nor a loser', () => {
        expect(filterWatchlist(items, 'gainers')).not.toContainEqual(expect.objectContaining({ symbol: 'MSFT' }));
        expect(filterWatchlist(items, 'losers')).not.toContainEqual(expect.objectContaining({ symbol: 'MSFT' }));
    });

    it('treats a missing changePercent as neither a gainer nor a loser', () => {
        const withMissing = [...items, { symbol: 'NOPE' }];
        expect(filterWatchlist(withMissing, 'gainers').map((i) => i.symbol)).not.toContain('NOPE');
        expect(filterWatchlist(withMissing, 'losers').map((i) => i.symbol)).not.toContain('NOPE');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/filterWatchlist.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/filterWatchlist'`.

- [ ] **Step 3: Write the minimal implementation**

```ts
// lib/filterWatchlist.ts
export type WatchlistFilter = 'all' | 'gainers' | 'losers';

export function filterWatchlist<T extends { changePercent?: number }>(
    items: T[],
    filter: WatchlistFilter
): T[] {
    if (filter === 'all') return items;
    if (filter === 'gainers') return items.filter((item) => (item.changePercent ?? 0) > 0);
    return items.filter((item) => (item.changePercent ?? 0) < 0);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/filterWatchlist.test.ts
```
Expected: PASS, all 5 assertions.

- [ ] **Step 5: Wire the filter into `WatchlistManager.tsx`, restyled as a `.seg` control, replacing the sort button's raw utility classes**

```tsx
// Before:
'use client';

import React, { useState, useMemo } from 'react';
import WatchlistStockChip from './WatchlistStockChip';
import TradingViewWatchlist from './TradingViewWatchlist';
import { Button } from '@/components/ui/button';
import { ArrowDownAZ, ArrowUpZA, ArrowUpDown } from 'lucide-react';
import { WatchlistItem } from '@/database/models/watchlist.model';

interface WatchlistManagerProps {
    initialItems: WatchlistItem[]; // Using the DB model type directly or a simplified version
    userId: string;
}

export default function WatchlistManager({ initialItems, userId }: WatchlistManagerProps) {
    // Sort state: 'asc' (A-Z), 'desc' (Z-A), or null (added order/default)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

    const toggleSort = () => {
        if (sortOrder === null) setSortOrder('asc');
        else if (sortOrder === 'asc') setSortOrder('desc');
        else setSortOrder(null);
    };

    const sortedItems = useMemo(() => {
        if (!sortOrder) return initialItems;

        return [...initialItems].sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.symbol.localeCompare(b.symbol);
            } else {
                return b.symbol.localeCompare(a.symbol);
            }
        });
    }, [initialItems, sortOrder]);

    const watchlistSymbols = sortedItems.map((item) => item.symbol);

    return (
        <div className="space-y-6">
            <div className="bg-gray-900/30 rounded-xl border border-gray-600 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                        <span className="mr-2">Manage Symbols</span>
                        <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                            {watchlistSymbols.length}
                        </span>
                    </h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleSort}
                        className="h-8 px-2 text-gray-400 hover:text-gray-100 hover:bg-black/10"
                        title={
                            sortOrder === 'asc'
                                ? 'Sorted A-Z'
                                : sortOrder === 'desc'
                                    ? 'Sorted Z-A'
                                    : 'Default Order'
                        }
                    >
                        {sortOrder === 'asc' && <ArrowDownAZ className="w-4 h-4 mr-2" />}
                        {sortOrder === 'desc' && <ArrowUpZA className="w-4 h-4 mr-2" />}
                        {sortOrder === null && <ArrowUpDown className="w-4 h-4 mr-2" />}
                        <span className="text-xs">
                            {sortOrder === 'asc'
                                ? 'A-Z'
                                : sortOrder === 'desc'
                                    ? 'Z-A'
                                    : 'Sort'}
                        </span>
                    </Button>
                </div>

                {watchlistSymbols.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {sortedItems.map((item) => (
                            <WatchlistStockChip
                                key={item.symbol}
                                symbol={item.symbol}
                                userId={userId}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">No stocks in watchlist.</p>
                )}
            </div>

            <div className="min-h-[550px]">
                <TradingViewWatchlist symbols={watchlistSymbols} />
            </div>
        </div>
    );
}
```
```tsx
// After:
'use client';

import React, { useState, useMemo } from 'react';
import WatchlistStockChip from './WatchlistStockChip';
import TradingViewWatchlist from './TradingViewWatchlist';
import { Button } from '@/components/ui/button';
import { ArrowDownAZ, ArrowUpZA, ArrowUpDown } from 'lucide-react';
import { WatchlistItem } from '@/database/models/watchlist.model';
import { filterWatchlist, type WatchlistFilter } from '@/lib/filterWatchlist';

interface WatchlistManagerProps {
    initialItems: WatchlistItem[]; // Using the DB model type directly or a simplified version
    userId: string;
}

const FILTER_OPTIONS: { value: WatchlistFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'gainers', label: 'Gainers' },
    { value: 'losers', label: 'Losers' },
];

export default function WatchlistManager({ initialItems, userId }: WatchlistManagerProps) {
    // Sort state: 'asc' (A-Z), 'desc' (Z-A), or null (added order/default)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
    const [filter, setFilter] = useState<WatchlistFilter>('all');

    const toggleSort = () => {
        if (sortOrder === null) setSortOrder('asc');
        else if (sortOrder === 'asc') setSortOrder('desc');
        else setSortOrder(null);
    };

    const sortedItems = useMemo(() => {
        if (!sortOrder) return initialItems;

        return [...initialItems].sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.symbol.localeCompare(b.symbol);
            } else {
                return b.symbol.localeCompare(a.symbol);
            }
        });
    }, [initialItems, sortOrder]);

    const filteredItems = useMemo(
        () => filterWatchlist(sortedItems, filter),
        [sortedItems, filter]
    );

    const watchlistSymbols = filteredItems.map((item) => item.symbol);

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-600 rounded-none p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                        <span className="mr-2">Manage Symbols</span>
                        <span className="text-xs bg-gray-900 text-gray-500 px-2 py-0.5 rounded-none">
                            {watchlistSymbols.length}
                        </span>
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="seg">
                            {FILTER_OPTIONS.map((option) => (
                                <label key={option.value} className="seg-opt">
                                    <input
                                        type="radio"
                                        name="watchlist-filter"
                                        value={option.value}
                                        checked={filter === option.value}
                                        onChange={() => setFilter(option.value)}
                                        className="sr-only"
                                    />
                                    {option.label}
                                </label>
                            ))}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleSort}
                            className="h-8 px-2 rounded-none text-gray-400 hover:text-gray-100 hover:bg-gray-700"
                            title={
                                sortOrder === 'asc'
                                    ? 'Sorted A-Z'
                                    : sortOrder === 'desc'
                                        ? 'Sorted Z-A'
                                        : 'Default Order'
                            }
                        >
                            {sortOrder === 'asc' && <ArrowDownAZ className="w-4 h-4 mr-2" />}
                            {sortOrder === 'desc' && <ArrowUpZA className="w-4 h-4 mr-2" />}
                            {sortOrder === null && <ArrowUpDown className="w-4 h-4 mr-2" />}
                            <span className="text-xs">
                                {sortOrder === 'asc'
                                    ? 'A-Z'
                                    : sortOrder === 'desc'
                                        ? 'Z-A'
                                        : 'Sort'}
                            </span>
                        </Button>
                    </div>
                </div>

                {watchlistSymbols.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {filteredItems.map((item) => (
                            <WatchlistStockChip
                                key={item.symbol}
                                symbol={item.symbol}
                                userId={userId}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">No stocks match this filter.</p>
                )}
            </div>

            <div className="min-h-[550px]">
                <TradingViewWatchlist symbols={watchlistSymbols} />
            </div>
        </div>
    );
}
```

(`WatchlistItem` from `database/models/watchlist.model` doesn't carry a
`changePercent` field — confirm at this step; if it's absent,
`filterWatchlist`'s `changePercent ?? 0` fallback means "Gainers"/"Losers"
will show an empty list rather than crash, which is correct, safe behavior
for data the model doesn't have. `WatchlistTable.tsx` in Task 8, which
does receive live price/change data, is where a real gainers/losers signal
actually exists — if in practice `WatchlistManager`'s chip list has no
change data, this filter still type-checks and runs correctly, it just has
nothing to filter on here; that's an acceptable known limitation given "no
new backend/data wiring" is out of scope.)

- [ ] **Step 6: Restyle the watchlist page header in `app/(root)/watchlist/page.tsx`**

```tsx
// Before:
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-500">
                        Watchlist
                    </h1>
                    <p className="text-gray-500 mt-1">Track your favorite stocks and manage alerts.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <SearchCommand renderAs="button" label="Add Stock" initialStocks={[]} />
                </div>
            </div>
```
```tsx
// After:
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 pb-6 border-b-2 border-gray-600">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-100">
                        Watchlist
                    </h1>
                    <p className="text-gray-500 mt-1">Track your favorite stocks and manage alerts.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <SearchCommand renderAs="button" label="Add Stock" initialStocks={[]} />
                </div>
            </div>
```

- [ ] **Step 7: Verify**

```bash
npx vitest run
npx tsc --noEmit
```
Expected: full test suite passes (including the 5 new `filterWatchlist`
assertions); no type errors.

- [ ] **Step 8: Commit**

```bash
git add lib/filterWatchlist.ts __tests__/filterWatchlist.test.ts components/watchlist/WatchlistManager.tsx "app/(root)/watchlist/page.tsx"
git commit -m "Add All/Gainers/Losers segmented filter to watchlist, flatten page header"
```

---

### Task 8: WatchlistTable — flat card, accent/neutral change pills

**Files:**
- Modify: `components/watchlist/WatchlistTable.tsx`

**Interfaces:**
- Consumes: `.watchlist-table`/`.table-header-row`/`.table-row`/`.table-cell`
  from Task 3, `.tag`/`.tag-accent`/`.tag-neutral` from Task 6.

- [ ] **Step 1: Flatten the table wrapper and empty state**

```tsx
// Before:
    if (!stocks || stocks.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-600">
                <h3 className="text-xl font-medium text-gray-300 mb-2">Your watchlist is empty</h3>
                <p className="text-gray-500 mb-6">Add stocks to track their performance and set alerts.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white/70 backdrop-blur-md shadow-xl">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-black/5 text-gray-400 font-medium border-b border-black/10">
```
```tsx
// After:
    if (!stocks || stocks.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-800 rounded-none border border-gray-600">
                <h3 className="text-xl font-medium text-gray-300 mb-2">Your watchlist is empty</h3>
                <p className="text-gray-500 mb-6">Add stocks to track their performance and set alerts.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-none border border-gray-600 bg-gray-800">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-transparent text-gray-500 font-normal border-b-2 border-gray-600">
```

- [ ] **Step 2: Flatten row content — avatar, symbol chip, price, change pill**

```tsx
// Before:
                <tbody className="divide-y divide-black/10">
                    {stocks.map((stock: any) => {
                        const isPositive = stock.change >= 0;
                        return (
                            <tr key={stock.symbol} className="hover:bg-black/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-4">
                                        {stock.logo ? (
                                            <div className="w-10 h-10 relative rounded-full overflow-hidden bg-black/10 shadow-sm border border-black/5">
                                                <Image
                                                    src={stock.logo}
                                                    alt={stock.symbol}
                                                    fill
                                                    className="object-contain p-1.5"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-sm border border-black/5">
                                                {stock.symbol[0]}
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-100 text-base">{stock.name}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-300">
                                    <span className="bg-black/5 px-2.5 py-1 rounded-md text-xs font-mono border border-black/10">
                                        {stock.symbol}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-100 font-medium text-base tracking-tight">
                                    {formatCurrency(stock.price)}
                                </td>
                                <td className={`px-6 py-4 font-medium`}>
                                    <div className={`flex items-center w-fit px-2 py-1 rounded-md ${isPositive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                        {isPositive ? <ArrowUp className="w-3.5 h-3.5 mr-1.5" /> : <ArrowDown className="w-3.5 h-3.5 mr-1.5" />}
                                        {Math.abs(stock.changePercent).toFixed(2)}%
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-400 font-medium">
                                    {formatNumber(stock.marketCap)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <CreateAlertModal
                                            userId={userId}
                                            symbol={stock.symbol}
                                            currentPrice={stock.price}
                                            onAlertCreated={onRefresh}
                                        >
                                            <button className="p-2.5 rounded-full text-gray-400 hover:text-gray-100 hover:bg-black/10 transition-all border border-transparent hover:border-black/10" title="Add Alert">
                                                <Bell className="w-4.5 h-4.5" />
                                            </button>
                                        </CreateAlertModal>
```
```tsx
// After:
                <tbody className="divide-y divide-gray-700">
                    {stocks.map((stock: any) => {
                        const isPositive = stock.change >= 0;
                        return (
                            <tr key={stock.symbol} className="hover:bg-gray-900/60 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-4">
                                        {stock.logo ? (
                                            <div className="w-10 h-10 relative overflow-hidden bg-gray-900 border border-gray-600">
                                                <Image
                                                    src={stock.logo}
                                                    alt={stock.symbol}
                                                    fill
                                                    className="object-contain p-1.5"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 bg-teal-500 flex items-center justify-center text-xs font-bold text-gray-900 border border-gray-600">
                                                {stock.symbol[0]}
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-100 text-base">{stock.name}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-300">
                                    <span className="bg-gray-900 px-2.5 py-1 text-xs font-mono border border-gray-600">
                                        {stock.symbol}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-100 font-medium text-base tracking-tight">
                                    {formatCurrency(stock.price)}
                                </td>
                                <td className={`px-6 py-4 font-medium`}>
                                    <div className={`flex items-center w-fit px-2 py-1 ${isPositive ? "tag-accent" : "tag-neutral"}`}>
                                        {isPositive ? <ChevronUp className="w-3.5 h-3.5 mr-1.5" /> : <ChevronDown className="w-3.5 h-3.5 mr-1.5" />}
                                        {Math.abs(stock.changePercent).toFixed(2)}%
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-400 font-medium">
                                    {formatNumber(stock.marketCap)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <CreateAlertModal
                                            userId={userId}
                                            symbol={stock.symbol}
                                            currentPrice={stock.price}
                                            onAlertCreated={onRefresh}
                                        >
                                            <button className="p-2.5 text-gray-400 hover:text-gray-100 hover:bg-gray-900 transition-all border border-transparent hover:border-gray-600" title="Add Alert">
                                                <Bell className="w-4.5 h-4.5" />
                                            </button>
                                        </CreateAlertModal>
```

- [ ] **Step 3: Swap the `ArrowUp`/`ArrowDown` import for `ChevronUp`/`ChevronDown`**

```tsx
// Before:
import { ArrowUp, ArrowDown, Bell } from "lucide-react";
```
```tsx
// After:
import { ChevronUp, ChevronDown, Bell } from "lucide-react";
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
grep -c "rounded-full\|rounded-xl\|shadow-xl\|backdrop-blur\|from-teal-400\|bg-black/\|bg-white/" components/watchlist/WatchlistTable.tsx
```
Expected: `tsc` clean; grep returns `0`.

- [ ] **Step 5: Commit**

```bash
git add components/watchlist/WatchlistTable.tsx
git commit -m "Flatten WatchlistTable to Modernist tokens, accent/neutral change pills"
```

---

### Task 9: CreateAlertModal — segmented Above/Below, flat dialog

**Files:**
- Modify: `components/watchlist/CreateAlertModal.tsx`

**Interfaces:**
- Consumes: `.dialog`-equivalent look via shadcn `DialogContent` (already
  flat via `--radius: 0` from Task 1); `condition` state stays
  `"ABOVE" | "BELOW"` — same values `createAlert` already expects, only the
  picker widget changes.

- [ ] **Step 1: Replace the `<Select>` condition picker with a 2-option segmented control**

```tsx
// Before:
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAlert } from "@/lib/actions/alert.actions";
```
```tsx
// After:
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createAlert } from "@/lib/actions/alert.actions";
```

```tsx
// Before:
            <DialogContent className="sm:max-w-[425px] bg-white border-gray-600 text-gray-100 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-gray-100 mb-2">Price Alert</DialogTitle>
                </DialogHeader>
```
```tsx
// After:
            <DialogContent className="sm:max-w-[425px] bg-gray-800 border-2 border-gray-600 text-gray-100">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-extrabold tracking-tight text-gray-100 mb-2">Price Alert</DialogTitle>
                </DialogHeader>
```

```tsx
// Before:
                    {/* Alert Name */}
                    <div className="grid gap-2">
                        <Label className="text-gray-400 text-sm font-medium">Alert Name</Label>
                        <Input
                            value={alertName}
                            onChange={(e) => setAlertName(e.target.value)}
                            placeholder="e.g. Apple at Discount"
                            className="bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all rounded-md h-10"
                        />
                    </div>

                    {/* Stock Identifier */}
                    <div className="grid gap-2">
                        <Label className="text-gray-400 text-sm font-medium">Stock identifier</Label>
                        <div className="relative">
                            <Input
                                disabled
                                value={`${companyName || symbol} (${symbol})`}
                                className="bg-gray-900 border-none text-gray-500 shadow-inner rounded-md h-10"
                            />
                        </div>
                    </div>

                    {/* Alert Type */}
                    <div className="grid gap-2">
                        <Label className="text-gray-400 text-sm font-medium">Alert type</Label>
                        <Select disabled defaultValue="price">
                            <SelectTrigger className="bg-gray-900 border-gray-600 text-gray-200">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-600 text-gray-200">
                                <SelectItem value="price">Price</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Condition */}
                    <div className="grid gap-2">
                        <Label className="text-gray-400 text-sm font-medium">Condition</Label>
                        <Select value={condition} onValueChange={(val: any) => setCondition(val)}>
                            <SelectTrigger className="bg-gray-900 border-gray-600 text-gray-200 hover:border-gray-500 transition-colors">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-600 text-gray-200">
                                <SelectItem value="ABOVE">Greater than {">"}</SelectItem>
                                <SelectItem value="BELOW">Less than {"<"}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Threshold Value */}
                    <div className="grid gap-2">
                        <Label className="text-gray-400 text-sm font-medium">Threshold value</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500 font-semibold">$</span>
                            <Input
                                type="number"
                                step="0.01"
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(e.target.value)}
                                placeholder="eg: 140"
                                className="pl-7 bg-gray-900 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all rounded-md h-10 font-mono"
                            />
                        </div>
                    </div>

                    {/* Expiry Note */}
                    <div className="pt-1">
                        <p className="text-xs text-gray-500 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/50 mr-2"></span>
                            Alert expires automatically in 90 days
                        </p>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold h-11 text-base transition-all shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                        >
                            {loading ? "Creating Alert..." : "Create Alert"}
                        </Button>
                    </div>
```
```tsx
// After:
                    {/* Alert Name */}
                    <div className="grid gap-2">
                        <Label className="text-gray-400 text-sm font-medium">Alert Name</Label>
                        <Input
                            value={alertName}
                            onChange={(e) => setAlertName(e.target.value)}
                            placeholder="e.g. Apple at Discount"
                            className="bg-gray-900 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-0 rounded-none h-10"
                        />
                    </div>

                    {/* Stock Identifier */}
                    <div className="grid gap-2">
                        <Label className="text-gray-400 text-sm font-medium">Stock identifier</Label>
                        <div className="relative">
                            <Input
                                disabled
                                value={`${companyName || symbol} (${symbol})`}
                                className="bg-gray-900 border border-gray-600 text-gray-500 rounded-none h-10"
                            />
                        </div>
                    </div>

                    {/* Condition */}
                    <div className="grid gap-2">
                        <Label className="text-gray-400 text-sm font-medium">Condition</Label>
                        <div className="seg">
                            <label className="seg-opt">
                                <input
                                    type="radio"
                                    name="alert-condition"
                                    value="ABOVE"
                                    checked={condition === "ABOVE"}
                                    onChange={() => setCondition("ABOVE")}
                                    className="sr-only"
                                />
                                Above
                            </label>
                            <label className="seg-opt">
                                <input
                                    type="radio"
                                    name="alert-condition"
                                    value="BELOW"
                                    checked={condition === "BELOW"}
                                    onChange={() => setCondition("BELOW")}
                                    className="sr-only"
                                />
                                Below
                            </label>
                        </div>
                    </div>

                    {/* Threshold Value */}
                    <div className="grid gap-2">
                        <Label className="text-gray-400 text-sm font-medium">Threshold value</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500 font-semibold">$</span>
                            <Input
                                type="number"
                                step="0.01"
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(e.target.value)}
                                placeholder="eg: 140"
                                className="pl-7 bg-gray-900 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-0 transition-all rounded-none h-10 font-mono"
                            />
                        </div>
                    </div>

                    {/* Expiry Note */}
                    <div className="pt-1">
                        <p className="text-xs text-gray-500 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500/50 mr-2"></span>
                            Alert expires automatically in 90 days
                        </p>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-teal-500 hover:bg-teal-600 text-gray-900 font-extrabold h-11 text-base rounded-none"
                        >
                            {loading ? "Creating Alert..." : "Create Alert"}
                        </Button>
                    </div>
```

(The "Alert type" `<Select disabled defaultValue="price">` block is
removed entirely rather than restyled — it was a disabled, single-fixed-
option dropdown that only ever showed "Price" and could never be changed;
deleting dead UI rather than reskinning it is in scope for a redesign pass
touching this exact block, and the handoff's screen 1h has no such field.)

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
grep -c "bg-\[#FACC15\]\|shadow-\[0_0_15px\|rounded-md\|rounded-xl" components/watchlist/CreateAlertModal.tsx
```
Expected: `tsc` clean; grep returns `0`.

- [ ] **Step 3: Commit**

```bash
git add components/watchlist/CreateAlertModal.tsx
git commit -m "Replace alert condition Select with segmented control, flatten dialog"
```

---

### Task 10: AlertsPanel — status tag mapping, flat cards

**Files:**
- Create: `lib/getAlertStatus.ts`
- Create: `__tests__/getAlertStatus.test.ts`
- Modify: `components/watchlist/AlertsPanel.tsx`
- Modify: `components/watchlist/ConnectLineCard.tsx`
- Modify: `components/watchlist/WatchlistStockChip.tsx`

**Interfaces:**
- Produces: `getAlertStatus(alert: { active: boolean; triggered: boolean
  }): 'active' | 'triggered' | 'paused'` — pure function, imported by
  `AlertsPanel.tsx`.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/getAlertStatus.test.ts
import { describe, expect, it } from 'vitest';
import { getAlertStatus } from '@/lib/getAlertStatus';

describe('getAlertStatus', () => {
    it('is "triggered" once an alert has fired, even if still active', () => {
        expect(getAlertStatus({ active: true, triggered: true })).toBe('triggered');
    });

    it('is "triggered" for a fired alert that was also deactivated', () => {
        expect(getAlertStatus({ active: false, triggered: true })).toBe('triggered');
    });

    it('is "paused" for a deactivated alert that never fired', () => {
        expect(getAlertStatus({ active: false, triggered: false })).toBe('paused');
    });

    it('is "active" for a live, unfired alert', () => {
        expect(getAlertStatus({ active: true, triggered: false })).toBe('active');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/getAlertStatus.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/getAlertStatus'`.

- [ ] **Step 3: Write the minimal implementation**

```ts
// lib/getAlertStatus.ts
export type AlertStatus = 'active' | 'triggered' | 'paused';

export function getAlertStatus(alert: { active: boolean; triggered: boolean }): AlertStatus {
    if (alert.triggered) return 'triggered';
    if (!alert.active) return 'paused';
    return 'active';
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/getAlertStatus.test.ts
```
Expected: PASS, all 4 assertions.

- [ ] **Step 5: Wire the status tag into `AlertsPanel.tsx` and flatten its cards**

```tsx
// Before:
"use client";

import React from "react";
import { Trash2, TrendingUp, Bell } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteAlert } from "@/lib/actions/alert.actions";
import ConnectLineCard from "./ConnectLineCard";
```
```tsx
// After:
"use client";

import React from "react";
import { Trash2, Bell } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteAlert } from "@/lib/actions/alert.actions";
import { getAlertStatus } from "@/lib/getAlertStatus";
import ConnectLineCard from "./ConnectLineCard";
```

(`TrendingUp` was imported but never used in the original file — dropped
here since this task already touches every import in the file.)

```tsx
// Before:
    return (
        <div className="bg-gray-900/30 rounded-lg border border-gray-600 p-4 h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-100 flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-yellow-500" />
                    Alerts
                </h2>
                {/* <button className="text-sm text-yellow-500 hover:underline">Create Alert</button> */}
            </div>

            <ConnectLineCard userId={userId} initiallyConnected={lineConnected} />

            <div className="space-y-3">
                {alerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No active alerts. Add one from the watchlist.
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div key={alert._id} className="bg-gray-800/40 rounded-lg p-3 border border-gray-600 relative group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 rounded bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center font-bold text-xs text-white">
                                            {alert.symbol[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-100 text-sm">{alert.symbol}</div>
                                            <div className="text-xs text-gray-400">Target: {formatCurrency(alert.targetPrice)}</div>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-yellow-500 font-medium">
                                        Condition: Price {alert.condition.toLowerCase()} {formatCurrency(alert.targetPrice)}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-1">
                                        Active until {new Date(new Date(alert.createdAt).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <button
                                        onClick={() => handleDelete(alert._id)}
                                        className="text-gray-500 hover:text-red-500 transition-colors p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
```
```tsx
// After:
    return (
        <div className="bg-gray-800 rounded-none border border-gray-600 p-4 h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-100 flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-teal-500" />
                    Alerts
                </h2>
            </div>

            <ConnectLineCard userId={userId} initiallyConnected={lineConnected} />

            <div className="space-y-3">
                {alerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No active alerts. Add one from the watchlist.
                    </div>
                ) : (
                    alerts.map((alert) => {
                        const status = getAlertStatus(alert);
                        const statusTagClass =
                            status === 'active' ? 'tag-accent' : status === 'triggered' ? 'tag-outline' : 'tag-neutral';
                        return (
                            <div key={alert._id} className="bg-gray-900 rounded-none p-3 border border-gray-600 relative group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-teal-500 flex items-center justify-center font-bold text-xs text-gray-900 border border-gray-600">
                                                {alert.symbol[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-100 text-sm">{alert.symbol}</div>
                                                <div className="text-xs text-gray-400">Target: {formatCurrency(alert.targetPrice)}</div>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className={`tag ${statusTagClass}`}>{status}</span>
                                            <span className="text-xs text-gray-500">
                                                {alert.condition.toLowerCase()} {formatCurrency(alert.targetPrice)}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-1">
                                            Active until {new Date(new Date(alert.createdAt).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-2">
                                        <button
                                            onClick={() => handleDelete(alert._id)}
                                            className="text-gray-500 hover:text-teal-500 transition-colors p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
```

- [ ] **Step 6: Add the `.tag-outline` class (used above for "triggered") to `app/globals.css`'s `@layer utilities` block, next to `.tag-accent`/`.tag-neutral` from Task 6**

```css
    .tag-outline {
        @apply border border-teal-500 text-teal-500 bg-transparent;
    }
```

- [ ] **Step 7: Flatten `ConnectLineCard.tsx`**

```tsx
// Before:
    if (connected) {
        return (
            <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-600 mb-4 text-sm text-gray-100">
                🔔 เชื่อมต่อ LINE แล้ว ✓
            </div>
        );
    }

    return (
        <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-600 mb-4">
```
```tsx
// After:
    if (connected) {
        return (
            <div className="bg-gray-900 rounded-none p-3 border border-gray-600 mb-4 text-sm text-gray-100">
                🔔 เชื่อมต่อ LINE แล้ว ✓
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-none p-3 border border-gray-600 mb-4">
```

```tsx
// Before:
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="text-xs bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded font-medium disabled:opacity-50"
                >
```
```tsx
// After:
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="text-xs bg-teal-500 hover:bg-teal-600 text-gray-900 px-3 py-1.5 rounded-none font-medium disabled:opacity-50"
                >
```

- [ ] **Step 8: Flatten `WatchlistStockChip.tsx`**

```tsx
// Before:
        <div className="group flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700/80 rounded-full border border-gray-700 transition-all">
```
```tsx
// After:
        <div className="group flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-none border border-gray-600 transition-all">
```

```tsx
// Before:
            <button
                onClick={handleBellClick}
                className="text-gray-400 hover:text-yellow-400 transition-colors p-0.5"
                title="Create Alert"
                disabled={loadingPrice}
            >
```
```tsx
// After:
            <button
                onClick={handleBellClick}
                className="text-gray-400 hover:text-teal-500 transition-colors p-0.5"
                title="Create Alert"
                disabled={loadingPrice}
            >
```

```tsx
// Before:
                <button type="submit" className="text-gray-400 hover:text-red-400 transition-colors p-0.5" title="Remove">
```
```tsx
// After:
                <button type="submit" className="text-gray-400 hover:text-teal-500 transition-colors p-0.5" title="Remove">
```

- [ ] **Step 9: Verify**

```bash
npx vitest run
npx tsc --noEmit
```
Expected: full suite passes (including the 4 new `getAlertStatus`
assertions); no type errors.

- [ ] **Step 10: Commit**

```bash
git add lib/getAlertStatus.ts __tests__/getAlertStatus.test.ts app/globals.css components/watchlist/AlertsPanel.tsx components/watchlist/ConnectLineCard.tsx components/watchlist/WatchlistStockChip.tsx
git commit -m "Add alert status tags (active/triggered/paused), flatten alerts sidebar"
```

---

### Task 11: NewsGrid — flat cards, accent tag

**Files:**
- Modify: `components/watchlist/NewsGrid.tsx`

- [ ] **Step 1: Flatten card surface and the related-symbol tag**

```tsx
// Before:
                        className="block bg-gray-900/30 border border-gray-600 rounded-lg overflow-hidden hover:border-gray-700 transition-colors group"
                    >
                        <div className="p-4 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.related ? "bg-blue-100 text-blue-700" : "bg-gray-800 text-gray-400"
                                    }`}>
                                    {item.related || "MARKET"}
                                </span>
                                <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-gray-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-200 mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
```
```tsx
// After:
                        className="block bg-gray-800 border border-gray-600 rounded-none overflow-hidden hover:border-teal-500 transition-colors group"
                    >
                        <div className="p-4 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-none ${item.related ? "bg-teal-500 text-gray-900" : "bg-gray-900 text-gray-400"
                                    }`}>
                                    {item.related || "MARKET"}
                                </span>
                                <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-gray-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-200 mb-2 line-clamp-2 group-hover:text-teal-500 transition-colors">
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
grep -c "rounded-lg\|bg-blue-100\|text-blue-700\|group-hover:text-blue-400" components/watchlist/NewsGrid.tsx
```
Expected: `0`.

- [ ] **Step 3: Commit**

```bash
git add components/watchlist/NewsGrid.tsx
git commit -m "Flatten NewsGrid cards to Modernist tokens"
```

---

### Task 12: Dashboard chrome + StockSentimentCard + WatchlistButton

**Files:**
- Modify: `app/(root)/page.tsx`
- Modify: `components/stocks/StockSentimentCard.tsx`
- Modify: `components/WatchlistButton.tsx`

**Interfaces:**
- Consumes: tokens from Task 1. TradingView widget internals are untouched
  per the brainstorming decision — only the page background and the cards
  wrapping/adjacent to widgets change.

- [ ] **Step 1: Add section spacing/dividers to the dashboard grid in `app/(root)/page.tsx`**

```tsx
// Before:
    return (
        <div className="flex min-h-screen home-wrapper">
            <section className="grid w-full gap-8 home-section">
                <div className="md:col-span-1 xl:col-span-1">
                    <TradingViewWidget
                        title="Market Overview"
                        scriptUrl={`${scriptUrl}market-overview.js`}
                        config={MARKET_OVERVIEW_WIDGET_CONFIG}
                        className="custom-chart"
                        height={600}
                    />
                </div>
                <div className="md-col-span xl:col-span-2">
                    <TradingViewWidget
                        title="Stock Heatmap"
                        scriptUrl={`${scriptUrl}stock-heatmap.js`}
                        config={HEATMAP_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
            </section>
            <section className="grid w-full gap-8 home-section">
```
```tsx
// After:
    return (
        <div className="flex min-h-screen home-wrapper">
            <section className="grid w-full gap-8 home-section pb-8 border-b-2 border-gray-600">
                <div className="md:col-span-1 xl:col-span-1">
                    <TradingViewWidget
                        title="Market Overview"
                        scriptUrl={`${scriptUrl}market-overview.js`}
                        config={MARKET_OVERVIEW_WIDGET_CONFIG}
                        className="custom-chart"
                        height={600}
                    />
                </div>
                <div className="md-col-span xl:col-span-2">
                    <TradingViewWidget
                        title="Stock Heatmap"
                        scriptUrl={`${scriptUrl}stock-heatmap.js`}
                        config={HEATMAP_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
            </section>
            <section className="grid w-full gap-8 home-section pt-2">
```

- [ ] **Step 2: Flatten the `custom-chart` widget frame in `app/globals.css`**

```css
/* Before: */
.custom-chart.tradingview-widget-container iframe {
    border: 1px solid #FBCFE8;
    border-radius: 8px !important;
    overflow: hidden !important;
}
```
```css
/* After: */
.custom-chart.tradingview-widget-container iframe {
    border: 2px solid color-mix(in srgb, #201e1d 40%, transparent);
    border-radius: 0 !important;
    overflow: hidden !important;
}
```

- [ ] **Step 3: Flatten `StockSentimentCard.tsx`** (7 occurrences of the same
`rounded-* border-gray-600 bg-white/60 [backdrop-blur-sm]` pattern — apply
the same replacement at each)

```bash
sed -i '' \
  -e 's/rounded-2xl border border-gray-600 bg-white\/60 p-5 backdrop-blur-sm/rounded-none border border-gray-600 bg-gray-800 p-5/' \
  -e 's/rounded-2xl border border-gray-600 bg-white\/60 p-4 md:min-w-\[320px\]/rounded-none border border-gray-600 bg-gray-800 p-4 md:min-w-[320px]/' \
  -e 's/rounded-xl border border-gray-600 bg-white\/60 p-4/rounded-none border border-gray-600 bg-gray-800 p-4/' \
  -e 's/rounded-lg border border-gray-600 bg-white\/60 p-3/rounded-none border border-gray-600 bg-gray-900 p-3/g' \
  components/stocks/StockSentimentCard.tsx
```

- [ ] **Step 4: Verify the sed edits landed correctly**

```bash
grep -c "bg-white/60\|rounded-2xl\|rounded-xl\|rounded-lg\|backdrop-blur" components/stocks/StockSentimentCard.tsx
```
Expected: `0`.

- [ ] **Step 5: Flatten `WatchlistButton.tsx`'s icon variant**

```tsx
// Before:
                className={`flex items-center justify-center p-2 rounded-full transition-all ${added ? "text-yellow-400 hover:bg-yellow-400/10" : "text-gray-400 hover:text-gray-100 hover:bg-black/10"} ${loading ? "opacity-50 cursor-wait" : ""}`}
```
```tsx
// After:
                className={`flex items-center justify-center p-2 rounded-none transition-all ${added ? "text-teal-500 hover:bg-teal-500/10" : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"} ${loading ? "opacity-50 cursor-wait" : ""}`}
```

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
lsof -ti:3000 -sTCP:LISTEN | xargs -r kill; sleep 1
npm run dev > /tmp/modernist-dev.log 2>&1 &
for i in $(seq 1 20); do curl -sf http://localhost:3000/sign-in >/dev/null && break; sleep 1; done
curl -s http://localhost:3000/sign-in | grep -o 'font-family[^;]*' | head -3
```
Expected: `tsc` clean; the sign-in page's inline/critical CSS shows the
Archivo font stack (sanity check that Task 1's font swap is live end-to-end
through this point in the plan).

- [ ] **Step 7: Commit**

```bash
git add "app/(root)/page.tsx" app/globals.css components/stocks/StockSentimentCard.tsx components/WatchlistButton.tsx
git commit -m "Flatten dashboard chrome, sentiment card, and watchlist button"
```

---

### Task 13: Stock detail page chrome

**Files:**
- Modify: `app/(root)/stocks/[symbol]/page.tsx`

**Interfaces:**
- Consumes: tokens from Task 1; `WatchlistButton`/`StockSentimentCard`
  already flattened in Task 12.

- [ ] **Step 1: Add section spacing between the hero widgets and the sidebar header row**

```tsx
// Before:
        <div className="flex min-h-screen p-4 md:p-6 lg:p-8">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* Left column */}
                <div className="flex flex-col gap-6">
```
```tsx
// After:
        <div className="flex min-h-screen p-4 md:p-6 lg:p-8 border-t-2 border-gray-600">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* Left column */}
                <div className="flex flex-col gap-6">
```

```tsx
// Before:
                {/* Right column */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <WatchlistButton
```
```tsx
// After:
                {/* Right column */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between pb-4 border-b-2 border-gray-600">
                        <WatchlistButton
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add "app/(root)/stocks/[symbol]/page.tsx"
git commit -m "Flatten stock detail page chrome"
```

---

### Task 14: Logo recolor and final full-app verification sweep

**Files:**
- Modify: `components/Logo.tsx`

**Interfaces:**
- Consumes: nothing new — final task, verifies the whole plan.

- [ ] **Step 1: Recolor the mark from pink to accent**

```tsx
// Before:
            <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
                <circle cx="17" cy="17" r="17" fill="#f472b6" />
```
```tsx
// After:
            <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
                <circle cx="17" cy="17" r="17" fill="#ec3013" />
```

(`app/icon.svg`, the auto-served favicon, uses the same pink circle mark —
update it in step 3 below so the browser tab matches.)

- [ ] **Step 2: Verify `app/icon.svg` exists and recolor it if so**

```bash
grep -l "f472b6" app/icon.svg 2>/dev/null
```
If it prints a path, replace `#f472b6` with `#ec3013` in that file the same
way as Step 1 (same circle-mark SVG, one color attribute). If the command
prints nothing (file doesn't exist or already a different color), skip —
nothing to change.

- [ ] **Step 3: Full-app grep sweep for anything the per-file tasks missed**

```bash
grep -rn "rounded-xl\|rounded-2xl\|rounded-3xl\|shadow-2xl\|backdrop-blur\|from-teal-400\|from-pink\|#f472b6\|#ec4899\|#FACC15\|#EAB308" \
  app components --include="*.tsx" | grep -v node_modules
```
Expected: no output. If anything remains, it's a spot the per-file tasks
above didn't cover (e.g. a file not touched by this plan) — fix it inline
with the same rule table used throughout, following the pattern of the
nearest equivalent fix in Tasks 2–13.

- [ ] **Step 4: Full build + test verification**

```bash
npx tsc --noEmit
npx vitest run
npm run build
```
Expected: all three clean/passing — this is the final gate before handing
back to the user for a live visual check (no browser tooling in this
environment, per Global Constraints).

- [ ] **Step 5: Commit**

```bash
git add components/Logo.tsx app/icon.svg
git commit -m "Recolor logo/favicon to Modernist accent, final verification sweep"
```

- [ ] **Step 6: Manual handoff note for the user**

No automated step replaces a real look — after this task lands, ask the
user to run `npm run dev` and walk all 8 screens (sign in, sign up,
dashboard, watchlist, stock detail, alerts dialog, alerts sidebar, nav)
side-by-side with `design_handoff_stock_redesign/Tonkla Redesign.dc.html`
open in a browser tab, per the spec's testing plan.
