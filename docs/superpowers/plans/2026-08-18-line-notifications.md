# LINE Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send LINE messages to users who link their account — an
immediate push when a price alert triggers, and a daily 08:00-Thailand
digest of their watchlist's prices plus a few relevant news headlines.

**Architecture:** A new `LineLink` MongoDB collection (userId ↔ LINE
userId, plus a short-lived linking code) decoupled from better-auth's
`User` schema. A thin `lib/line/client.ts` wraps the LINE Messaging API
(signature verification, reply, push). A webhook route completes the
linking handshake. Two Inngest functions — one extending the existing
5-minute alert-check cron, one new daily cron — call `pushMessage` for
linked users.

**Tech Stack:** Next.js 15 App Router route handlers, Mongoose, Inngest,
vitest (existing conventions in `__tests__/`), no new npm dependencies
(LINE's HTTP API is called via the built-in `fetch`, signature
verification via Node's built-in `crypto`).

## Global Constraints

- LINE Notify is discontinued (shut down 2025-03-31) — this uses the LINE
  **Messaging API** through a LINE Official Account, not LINE Notify.
- Account linking uses a 6-digit code sent as a LINE text message —
  **no OAuth / LINE Login channel**, per the approved design.
- `LineLink` is a **separate collection**, not an extension of
  better-auth's `User` schema.
- **Email is out of scope** for this feature — do not wire up the
  existing unused email templates as part of this work.
- New env vars: `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET` (both
  server-only, never exposed to the client), `NEXT_PUBLIC_LINE_OA_ID`
  (public — used client-side to build the add-friend link).
- No live webhook testing is possible in this environment (LINE requires
  a public HTTPS URL; the user is deferring that until Vercel deployment).
  Every task's verification is `npx tsc --noEmit`, `npm test`, and where
  applicable a mocked-request test — not a live LINE round-trip.
- MongoDB Atlas may be unreachable from this network (a known,
  pre-existing DNS issue unrelated to this feature — confirmed during the
  prior rebrand work). If a verification step needs a live DB and it
  fails with `MongooseServerSelectionError`, that's this same known issue,
  not a regression to chase.
- Follow this repo's existing conventions exactly: models use the
  `(models?.X as Model<IX>) || model<IX>('X', XSchema)` guard; server
  actions start with `'use server'`, call `await connectToDatabase()`
  first, use `console.error` + rethrow for mutations and safe-fallback
  for reads; Inngest `step.run` callbacks use `const { x } = await
  import(...)` dynamic imports; tests import explicitly from `'vitest'`
  and live flat under `__tests__/` as `<subject>.test.ts`.

---

### Task 1: `LineLink` model

**Files:**
- Create: `database/models/lineLink.model.ts`

**Interfaces:**
- Produces: `LineLink` (Mongoose model, default export style matches
  `Alert`/`Watchlist` — named export `LineLink`), `ILineLink` interface
  with fields `userId: string`, `lineUserId: string | null`, `linkCode:
  string | null`, `linkCodeExpiresAt: Date | null`, `linkedAt: Date |
  null`. Later tasks import as `import { LineLink } from
  "@/database/models/lineLink.model"` (or `import { LineLink } from
  "@/database/models/lineLink.model"` via the same dynamic-import style
  used elsewhere in `lib/inngest/functions.ts`).

- [ ] **Step 1: Create the model**

```ts
// database/models/lineLink.model.ts
import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface ILineLink extends Document {
    userId: string;
    lineUserId: string | null;
    linkCode: string | null;
    linkCodeExpiresAt: Date | null;
    linkedAt: Date | null;
}

const LineLinkSchema = new Schema<ILineLink>(
    {
        userId: { type: String, required: true, unique: true, index: true },
        lineUserId: { type: String, default: null },
        linkCode: { type: String, default: null },
        linkCodeExpiresAt: { type: Date, default: null },
        linkedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export const LineLink: Model<ILineLink> =
    (models?.LineLink as Model<ILineLink>) || model<ILineLink>('LineLink', LineLinkSchema);
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```
Expected: no new errors (this repo has a pre-existing baseline of 11
unrelated errors in `lib/inngest/functions.ts`, `lib/nodemailer/
reset-password.ts`, and `__tests__/` — confirm your count matches that
baseline, not zero).

- [ ] **Step 3: Commit**

```bash
git add database/models/lineLink.model.ts
git commit -m "Add LineLink model for LINE account linking"
```

---

### Task 2: LINE Messaging API client

**Files:**
- Create: `lib/line/client.ts`
- Test: `__tests__/line.client.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `hasLineConfig: boolean`, `verifySignature(rawBody: string,
  signatureHeader: string | null): boolean`, `replyMessage(replyToken:
  string, text: string): Promise<{ status: 'sent' | 'skipped' |
  'failed' }>`, `pushMessage(lineUserId: string, text: string):
  Promise<{ status: 'sent' | 'skipped' | 'failed' }>`. Later tasks import
  as `import { verifySignature, replyMessage, pushMessage } from
  "@/lib/line/client"` (or the dynamic-import equivalent inside Inngest
  `step.run` callbacks).

This module reads `LINE_CHANNEL_ACCESS_TOKEN`/`LINE_CHANNEL_SECRET` at
**module load time** into top-level constants — matching
`lib/nodemailer/index.ts`'s `hasEmailConfig` pattern, where an unset
config degrades every send function to a no-op `{ status: 'skipped' }`
instead of throwing. This module-load-time read is why the tests below
need `vi.resetModules()` + a dynamic `await import(...)` per test, not a
static top-of-file import — the module must be re-evaluated after each
test sets/clears `process.env`.

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/line.client.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';

afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
    delete process.env.LINE_CHANNEL_SECRET;
});

describe('verifySignature', () => {
    it('returns true for a correctly signed body', async () => {
        process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-token';
        process.env.LINE_CHANNEL_SECRET = 'test-secret';
        const { verifySignature } = await import('@/lib/line/client');

        const body = '{"events":[]}';
        const signature = crypto.createHmac('sha256', 'test-secret').update(body).digest('base64');

        expect(verifySignature(body, signature)).toBe(true);
    });

    it('returns false for a tampered body', async () => {
        process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-token';
        process.env.LINE_CHANNEL_SECRET = 'test-secret';
        const { verifySignature } = await import('@/lib/line/client');

        const signature = crypto.createHmac('sha256', 'test-secret').update('{"events":[]}').digest('base64');

        expect(verifySignature('{"events":[{"tampered":true}]}', signature)).toBe(false);
    });

    it('returns false when the signature header is missing', async () => {
        process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-token';
        process.env.LINE_CHANNEL_SECRET = 'test-secret';
        const { verifySignature } = await import('@/lib/line/client');

        expect(verifySignature('{"events":[]}', null)).toBe(false);
    });
});

describe('pushMessage', () => {
    it('sends a push message and returns sent on success', async () => {
        process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-token';
        process.env.LINE_CHANNEL_SECRET = 'test-secret';
        const { pushMessage } = await import('@/lib/line/client');

        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));

        const result = await pushMessage('U123', 'hello');
        expect(result).toEqual({ status: 'sent' });
    });

    it('returns skipped when LINE credentials are not configured', async () => {
        const { pushMessage } = await import('@/lib/line/client');

        const fetchSpy = vi.spyOn(global, 'fetch');
        const result = await pushMessage('U123', 'hello');

        expect(result).toEqual({ status: 'skipped' });
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('returns failed when LINE responds with a non-2xx status', async () => {
        process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-token';
        process.env.LINE_CHANNEL_SECRET = 'test-secret';
        const { pushMessage } = await import('@/lib/line/client');

        vi.spyOn(global, 'fetch').mockResolvedValue(new Response('bad request', { status: 400 }));

        const result = await pushMessage('U123', 'hello');
        expect(result).toEqual({ status: 'failed' });
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/line.client.test.ts`
Expected: FAIL — `Cannot find module '@/lib/line/client'` (the file
doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// lib/line/client.ts
import crypto from 'crypto';

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '';
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET ?? '';

export const hasLineConfig = Boolean(CHANNEL_ACCESS_TOKEN && CHANNEL_SECRET);

if (!hasLineConfig) {
    console.warn('⚠️ LINE credentials are not configured. LINE notifications are disabled until LINE_CHANNEL_ACCESS_TOKEN and LINE_CHANNEL_SECRET are set.');
}

export function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!signatureHeader || !CHANNEL_SECRET) return false;
    const hash = crypto.createHmac('sha256', CHANNEL_SECRET).update(rawBody).digest('base64');
    return hash === signatureHeader;
}

type SendResult = { status: 'sent' | 'skipped' | 'failed' };

export async function replyMessage(replyToken: string, text: string): Promise<SendResult> {
    if (!hasLineConfig) {
        console.warn('⚠️ LINE reply skipped: credentials are not configured.');
        return { status: 'skipped' };
    }
    try {
        const res = await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({ replyToken, messages: [{ type: 'text', text }] }),
        });
        if (!res.ok) {
            console.error('LINE reply failed:', res.status, await res.text());
            return { status: 'failed' };
        }
        return { status: 'sent' };
    } catch (error) {
        console.error('LINE reply error:', error);
        return { status: 'failed' };
    }
}

export async function pushMessage(lineUserId: string, text: string): Promise<SendResult> {
    if (!hasLineConfig) {
        console.warn('⚠️ LINE push skipped: credentials are not configured.');
        return { status: 'skipped' };
    }
    try {
        const res = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({ to: lineUserId, messages: [{ type: 'text', text }] }),
        });
        if (!res.ok) {
            console.error('LINE push failed:', res.status, await res.text());
            return { status: 'failed' };
        }
        return { status: 'sent' };
    } catch (error) {
        console.error('LINE push error:', error);
        return { status: 'failed' };
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/line.client.test.ts`
Expected: PASS, 6/6.

- [ ] **Step 5: Verify no new type errors**

```bash
npx tsc --noEmit
```
Expected: same pre-existing 11-error baseline, nothing new.

- [ ] **Step 6: Commit**

```bash
git add lib/line/client.ts __tests__/line.client.test.ts
git commit -m "Add LINE Messaging API client with signature verification"
```

---

### Task 3: Account-linking server actions

**Files:**
- Create: `lib/actions/line.actions.ts`

**Interfaces:**
- Consumes: `LineLink` model from Task 1
  (`import { LineLink } from "@/database/models/lineLink.model"`).
- Produces: `generateLinkCode(userId: string): Promise<{ linkCode:
  string; expiresAt: string }>`, `getLineLinkStatus(userId: string):
  Promise<{ connected: boolean }>`. Task 5 (UI) calls both of these
  directly from a client component.

- [ ] **Step 1: Write the implementation**

```ts
// lib/actions/line.actions.ts
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
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```
Expected: same pre-existing baseline, nothing new. (No live-DB test here
— MongoDB Atlas may be unreachable per Global Constraints; this task's
correctness is covered by TypeScript + the webhook test in Task 4, which
exercises the same `LineLink` query/update shape against a mocked model.)

- [ ] **Step 3: Commit**

```bash
git add lib/actions/line.actions.ts
git commit -m "Add server actions for generating and checking LINE link codes"
```

---

### Task 4: Webhook route for completing the link

**Files:**
- Create: `app/api/line/webhook/route.ts`
- Test: `__tests__/line.webhook.test.ts`

**Interfaces:**
- Consumes: `verifySignature`, `replyMessage` from Task 2
  (`@/lib/line/client`); `LineLink` from Task 1
  (`@/database/models/lineLink.model`); `connectToDatabase` from
  `@/database/mongoose`.
- Produces: `POST(request: NextRequest): Promise<NextResponse>` — LINE's
  webhook target. No other task calls this directly; LINE's servers do.

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/line.webhook.test.ts
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
    vi.restoreAllMocks();
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/line.webhook.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/line/webhook/route'`.

- [ ] **Step 3: Write the implementation**

```ts
// app/api/line/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySignature, replyMessage } from '@/lib/line/client';
import { connectToDatabase } from '@/database/mongoose';
import { LineLink } from '@/database/models/lineLink.model';

export async function POST(request: NextRequest) {
    const rawBody = await request.text();
    const signature = request.headers.get('x-line-signature');

    if (!verifySignature(rawBody, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const events = body.events ?? [];

    await connectToDatabase();

    for (const event of events) {
        if (event.type !== 'message' || event.message?.type !== 'text') continue;

        const code = event.message.text.trim();
        const lineUserId = event.source?.userId;
        if (!lineUserId) continue;

        const link = await LineLink.findOne({
            linkCode: code,
            linkCodeExpiresAt: { $gt: new Date() },
        });

        if (!link) continue;

        link.lineUserId = lineUserId;
        link.linkedAt = new Date();
        link.linkCode = null;
        link.linkCodeExpiresAt = null;
        await link.save();

        await replyMessage(event.replyToken, 'เชื่อมต่อสำเร็จ ✅ ตอนนี้คุณจะได้รับแจ้งเตือนราคาหุ้นผ่าน LINE แล้ว');
    }

    return NextResponse.json({ status: 'ok' });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/line.webhook.test.ts`
Expected: PASS, 3/3.

- [ ] **Step 5: Verify no new type errors**

```bash
npx tsc --noEmit
```
Expected: same pre-existing baseline.

- [ ] **Step 6: Commit**

```bash
git add app/api/line/webhook/route.ts __tests__/line.webhook.test.ts
git commit -m "Add LINE webhook route to complete account linking"
```

---

### Task 5: "Connect LINE" UI in the Alerts panel

**Files:**
- Create: `components/watchlist/ConnectLineCard.tsx`
- Modify: `components/watchlist/AlertsPanel.tsx`
- Modify: `app/(root)/watchlist/page.tsx`

**Interfaces:**
- Consumes: `generateLinkCode`, `getLineLinkStatus` from Task 3
  (`@/lib/actions/line.actions`).
- Produces: `ConnectLineCard` (default export), props `{ userId: string;
  initiallyConnected: boolean }`. `AlertsPanel`'s prop type grows to
  include `userId: string` and `lineConnected: boolean` — both required
  (this task threads them from the page down, so no optional/backward
  compat handling is needed).

- [ ] **Step 1: Create `ConnectLineCard`**

```tsx
// components/watchlist/ConnectLineCard.tsx
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
            const result = await generateLinkCode(userId);
            setCode(result.linkCode);
        } catch {
            setCode(null);
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshStatus = async () => {
        const status = await getLineLinkStatus(userId);
        setConnected(status.connected);
    };

    if (connected) {
        return (
            <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-600 mb-4 text-sm text-gray-100">
                🔔 เชื่อมต่อ LINE แล้ว ✓
            </div>
        );
    }

    return (
        <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-600 mb-4">
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
                    className="text-xs bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded font-medium disabled:opacity-50"
                >
                    {loading ? 'กำลังสร้างรหัส...' : 'สร้างรหัสเชื่อมต่อ'}
                </button>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Wire it into `AlertsPanel.tsx`**

```tsx
// Before (top of file):
"use client";

import React from "react";
import { Trash2, TrendingUp, Bell } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteAlert } from "@/lib/actions/alert.actions";

interface AlertsPanelProps {
    alerts: any[];
    onRefresh?: () => void;
}

export default function AlertsPanel({ alerts, onRefresh }: AlertsPanelProps) {
```
```tsx
// After:
"use client";

import React from "react";
import { Trash2, TrendingUp, Bell } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteAlert } from "@/lib/actions/alert.actions";
import ConnectLineCard from "./ConnectLineCard";

interface AlertsPanelProps {
    alerts: any[];
    userId: string;
    lineConnected: boolean;
    onRefresh?: () => void;
}

export default function AlertsPanel({ alerts, userId, lineConnected, onRefresh }: AlertsPanelProps) {
```

```tsx
// Before:
                {/* <button className="text-sm text-yellow-500 hover:underline">Create Alert</button> */}
            </div>

            <div className="space-y-3">
```
```tsx
// After:
                {/* <button className="text-sm text-yellow-500 hover:underline">Create Alert</button> */}
            </div>

            <ConnectLineCard userId={userId} initiallyConnected={lineConnected} />

            <div className="space-y-3">
```

- [ ] **Step 3: Fetch LINE status and pass props from `app/(root)/watchlist/page.tsx`**

```tsx
// Before:
import React, { Suspense } from 'react';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserWatchlist } from '@/lib/actions/watchlist.actions';
import { getUserAlerts } from '@/lib/actions/alert.actions';
import { getNews } from '@/lib/actions/finnhub.actions';
import WatchlistManager from '@/components/watchlist/WatchlistManager';
import AlertsPanel from '@/components/watchlist/AlertsPanel';
import NewsGrid from '@/components/watchlist/NewsGrid';
import SearchCommand from '@/components/SearchCommand';
import { Loader2 } from 'lucide-react';
```
```tsx
// After:
import React, { Suspense } from 'react';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserWatchlist } from '@/lib/actions/watchlist.actions';
import { getUserAlerts } from '@/lib/actions/alert.actions';
import { getNews } from '@/lib/actions/finnhub.actions';
import { getLineLinkStatus } from '@/lib/actions/line.actions';
import WatchlistManager from '@/components/watchlist/WatchlistManager';
import AlertsPanel from '@/components/watchlist/AlertsPanel';
import NewsGrid from '@/components/watchlist/NewsGrid';
import SearchCommand from '@/components/SearchCommand';
import { Loader2 } from 'lucide-react';
```

```tsx
// Before:
    // Parallel data fetching
    const [watchlistItems, alerts, news] = await Promise.all([
        getUserWatchlist(userId),
        getUserAlerts(userId),
        getNews() // Initial news fetch
    ]);
```
```tsx
// After:
    // Parallel data fetching
    const [watchlistItems, alerts, news, lineStatus] = await Promise.all([
        getUserWatchlist(userId),
        getUserAlerts(userId),
        getNews(), // Initial news fetch
        getLineLinkStatus(userId)
    ]);
```

```tsx
// Before:
                {/* Sidebar - Alerts */}
                <div className="lg:col-span-1">
                    <AlertsPanel alerts={alerts} />
                </div>
```
```tsx
// After:
                {/* Sidebar - Alerts */}
                <div className="lg:col-span-1">
                    <AlertsPanel alerts={alerts} userId={userId} lineConnected={lineStatus.connected} />
                </div>
```

- [ ] **Step 4: Add the public env var placeholder**

Add one line to `.env` (the real, gitignored one at the repo root — not
tracked by git, so this step has no commit):
```
NEXT_PUBLIC_LINE_OA_ID=
```
(Leave the value empty for now — it's filled in once the user creates
their LINE Official Account. `README.md` documentation for this and the
two server-only LINE env vars is Task 8.)

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
```
Expected: same pre-existing baseline, nothing new. (No live route test —
this page requires a live DB session per Global Constraints; visual/live
verification happens in Task 8's final sweep once Atlas is reachable
again.)

- [ ] **Step 6: Commit**

```bash
git add components/watchlist/ConnectLineCard.tsx components/watchlist/AlertsPanel.tsx "app/(root)/watchlist/page.tsx"
git commit -m "Add Connect LINE card to the Watchlist Alerts panel"
```

---

### Task 6: Push a LINE message when a price alert triggers

**Files:**
- Modify: `lib/inngest/functions.ts`

**Interfaces:**
- Consumes: `LineLink` from Task 1, `pushMessage` from Task 2.
- Produces: no new exports — this modifies the existing
  `checkStockAlerts` function's internal behavior only. Its exported
  signature (`inngest.createFunction(...)`, id `'check-stock-alerts'`)
  is unchanged.

- [ ] **Step 1: Locate and modify the `process-triggered-alerts` step**

Find this block inside `checkStockAlerts` (search for
`'process-triggered-alerts'`):

```ts
// Before:
        if (triggeredAlerts.length > 0) {
            await step.run('process-triggered-alerts', async () => {
                const { connectToDatabase } = await import("@/database/mongoose");
                const { Alert } = await import("@/database/models/alert.model");
                // In a real app we would import 'kit' here and use kit.sendBroadcast or similar
                // For now, we just log it as the critical logic is the detection
                await connectToDatabase();

                for (const { alert, currentPrice } of triggeredAlerts) {
                    console.log(`🚀 ALERT FIRED: ${alert.symbol} is ${currentPrice} (${alert.condition} ${alert.targetPrice})`);

                    // Mark triggered
                    await Alert.findByIdAndUpdate(alert._id, { triggered: true, active: false });
                }
            });
        }
```
```ts
// After:
        if (triggeredAlerts.length > 0) {
            await step.run('process-triggered-alerts', async () => {
                const { connectToDatabase } = await import("@/database/mongoose");
                const { Alert } = await import("@/database/models/alert.model");
                const { LineLink } = await import("@/database/models/lineLink.model");
                const { pushMessage } = await import("@/lib/line/client");
                await connectToDatabase();

                for (const { alert, currentPrice } of triggeredAlerts) {
                    console.log(`🚀 ALERT FIRED: ${alert.symbol} is ${currentPrice} (${alert.condition} ${alert.targetPrice})`);

                    // Mark triggered
                    await Alert.findByIdAndUpdate(alert._id, { triggered: true, active: false });

                    // Notify via LINE if the user has linked their account
                    const lineLink = await LineLink.findOne({ userId: alert.userId });
                    if (lineLink?.lineUserId) {
                        const conditionText = alert.condition === 'ABOVE' ? 'สูงกว่า' : 'ต่ำกว่า';
                        await pushMessage(
                            lineLink.lineUserId,
                            `🔔 ${alert.symbol} ถึงราคาที่ตั้งไว้แล้ว\nเงื่อนไข: ราคา${conditionText} $${alert.targetPrice}\nราคาปัจจุบัน: $${currentPrice}`
                        );
                    }
                }
            });
        }
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```
Expected: same pre-existing baseline, nothing new.

- [ ] **Step 3: Commit**

```bash
git add lib/inngest/functions.ts
git commit -m "Push a LINE message when a price alert triggers"
```

---

### Task 7: Daily watchlist + news digest via LINE

**Files:**
- Modify: `lib/inngest/functions.ts`
- Modify: `app/api/inngest/route.ts`

**Interfaces:**
- Consumes: `LineLink` (Task 1), `pushMessage` (Task 2), the existing
  `getUserWatchlist(userId: string)` (`@/lib/actions/watchlist.actions`),
  `getWatchlistData(symbols: string[])` and `getNews(symbols?: string[])`
  (`@/lib/actions/finnhub.actions`) — all three already exist and are
  unmodified by this plan.
- Produces: `sendDailyLineDigest` (exported Inngest function, id
  `'send-daily-line-digest'`). Task-external consumer: `app/api/inngest/
  route.ts`'s `functions` array.

- [ ] **Step 1: Add the new function to `lib/inngest/functions.ts`**

Add this as a new export, near `checkStockAlerts` (same file):

```ts
export const sendDailyLineDigest = inngest.createFunction(
    { id: 'send-daily-line-digest', triggers: [{ cron: '0 1 * * *' }] }, // 01:00 UTC = 08:00 Thailand
    async ({ step }) => {
        const linkedUsers = await step.run('fetch-linked-users', async () => {
            const { connectToDatabase } = await import("@/database/mongoose");
            const { LineLink } = await import("@/database/models/lineLink.model");

            await connectToDatabase();
            return await LineLink.find({ lineUserId: { $ne: null } }).lean();
        });

        if (!linkedUsers || linkedUsers.length === 0) {
            return { message: 'No LINE-linked users to notify.' };
        }

        let sent = 0;
        let skipped = 0;

        for (const link of linkedUsers as any[]) {
            await step.run(`send-digest-${link.userId}`, async () => {
                const { getUserWatchlist } = await import("@/lib/actions/watchlist.actions");
                const { getWatchlistData, getNews } = await import("@/lib/actions/finnhub.actions");
                const { pushMessage } = await import("@/lib/line/client");

                const watchlist = await getUserWatchlist(link.userId);
                const symbols = watchlist.map((item: any) => item.symbol);

                if (symbols.length === 0) {
                    skipped++;
                    return;
                }

                const [priceData, news] = await Promise.all([
                    getWatchlistData(symbols),
                    getNews(symbols).catch(() => []),
                ]);

                const priceLines = priceData
                    .slice(0, 10)
                    .map((item: any) => `${item.symbol}: $${item.price.toFixed(2)} (${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%)`)
                    .join('\n');

                const newsLines = news
                    .slice(0, 5)
                    .map((article: any) => `• ${article.headline}`)
                    .join('\n');

                const extraCount = priceData.length > 10 ? `\n...และอีก ${priceData.length - 10} ตัว` : '';

                const text = `📊 สรุป Watchlist ประจำวัน\n\n${priceLines}${extraCount}\n\n📰 ข่าวที่เกี่ยวข้อง\n${newsLines || 'ไม่มีข่าวใหม่วันนี้'}`;

                sent++;
                await pushMessage(link.lineUserId, text);
            });
        }

        return { linkedUsers: linkedUsers.length, sent, skipped };
    }
);
```

- [ ] **Step 2: Register it in `app/api/inngest/route.ts`**

```ts
// Before:
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { sendWeeklyNewsSummary, sendSignUpEmail, checkStockAlerts, checkInactiveUsers } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [sendSignUpEmail, sendWeeklyNewsSummary, checkStockAlerts, checkInactiveUsers],
})
```
```ts
// After:
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { sendWeeklyNewsSummary, sendSignUpEmail, checkStockAlerts, checkInactiveUsers, sendDailyLineDigest } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [sendSignUpEmail, sendWeeklyNewsSummary, checkStockAlerts, checkInactiveUsers, sendDailyLineDigest],
})
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```
Expected: same pre-existing baseline, nothing new.

- [ ] **Step 4: Commit**

```bash
git add lib/inngest/functions.ts app/api/inngest/route.ts
git commit -m "Add daily LINE watchlist and news digest"
```

---

### Task 8: Document env vars and final verification sweep

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add the LINE env vars to both documented `.env` blocks**

`README.md` has two near-identical `## 🔐 Environment Variables` code
blocks (one for "Hosted (MongoDB Atlas)", one for "Local (Docker
Compose)"). In **both**, add this section right after the existing
`# Inngest Signing Key` block and before `# Email (Nodemailer via
Gmail...)`:

```env
# LINE Messaging API (optional; enables price-alert and daily digest notifications)
# Create a LINE Official Account + Messaging API channel at https://developers.line.biz/console/
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
# Public — used client-side to build the "add friend" link, e.g. @abc1234
NEXT_PUBLIC_LINE_OA_ID=@your_line_oa_id
```

- [ ] **Step 2: Run the full test suite**

```bash
npm test
```
Expected: every existing test still passes, plus the two new files from
Tasks 2 and 4 (`line.client.test.ts`: 6 tests, `line.webhook.test.ts`: 3
tests) — 9 new passing tests, zero failures, zero regressions in the
pre-existing suite.

- [ ] **Step 3: Full type check and build**

```bash
npx tsc --noEmit
```
Expected: identical to the pre-existing 11-error baseline (same files,
same errors) — confirms nothing this plan touched introduced a type
error.

```bash
npm run build
```
Expected: this requires a live MongoDB connection for static generation.
If Atlas is still unreachable (per Global Constraints), this will fail
with `MongooseServerSelectionError` — that's the known pre-existing
environment issue, not something to debug as part of this plan. If Atlas
*is* reachable, this should succeed cleanly.

- [ ] **Step 4: Grep sweep for accidental leftovers**

```bash
grep -rn "LINE_NOTIFY\|line-notify" app components lib database --include="*.ts" --include="*.tsx"
```
Expected: zero matches — confirms no stray reference to the discontinued
LINE Notify API snuck in anywhere.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "Document LINE Messaging API environment variables"
```
