# Price Alert Auto-Rearm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a price alert fire again after the price moves genuinely away
from the target and back, instead of firing once and staying dead forever.

**Architecture:** Add an `armed` boolean to the `Alert` model. A new pure,
unit-tested function `evaluateAlertState` classifies each alert as
`'fire' | 'rearm' | 'none'` given its condition, target, current price,
and armed state, using a 3% hysteresis band to prevent notification spam
when price hovers near the target. The existing 5-minute cron
(`checkStockAlerts`) calls it instead of its old one-shot boolean check.

**Tech Stack:** TypeScript, Mongoose, Inngest, vitest (existing
`__tests__/` conventions).

## Global Constraints

- Hysteresis band: **3%**, fixed (not configurable).
- `BELOW` alert (target `T`): fires at `price <= T`; re-arms (silently, no
  notification) at `price >= T * 1.03`.
- `ABOVE` alert (target `T`): fires at `price >= T`; re-arms at `price <=
  T * 0.97`.
- Applies uniformly to every existing alert in the database — no
  legacy/new alert distinction.
- No UI changes. No per-alert opt-out. No configurable band.
- Follow this repo's existing conventions: vitest tests import explicitly
  from `'vitest'`, live flat under `__tests__/` as `<subject>.test.ts`;
  Inngest `step.run` callbacks use `const { x } = await import(...)`
  dynamic imports for anything touching the DB or external APIs, but a
  pure helper with no I/O is imported statically at the top of the file
  (matching how `getFormattedTodayDate`, `callAIProviderWithFallback`,
  etc. are already imported in `lib/inngest/functions.ts`).

---

### Task 1: Add `armed` field to the Alert model

**Files:**
- Modify: `database/models/alert.model.ts`

**Interfaces:**
- Produces: `IAlert.armed: boolean`, defaulting to `true` for every alert
  (new and pre-existing — Mongoose applies schema defaults on read for
  documents missing the field, so the 69 alerts already in the database
  before this change are treated as `armed: true` automatically, no
  migration needed).

- [ ] **Step 1: Add the field**

```ts
// Before:
export interface IAlert extends Document {
    userId: string;
    symbol: string;
    targetPrice: number;
    condition: 'ABOVE' | 'BELOW';
    active: boolean;
    triggered: boolean;
    expiresAt: Date;
    createdAt: Date;
}

const AlertSchema = new Schema<IAlert>(
    {
        userId: { type: String, required: true, index: true },
        symbol: { type: String, required: true, uppercase: true, trim: true },
        targetPrice: { type: Number, required: true },
        condition: { type: String, enum: ['ABOVE', 'BELOW'], required: true },
        active: { type: Boolean, default: true },
        triggered: { type: Boolean, default: false },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);
```
```ts
// After:
export interface IAlert extends Document {
    userId: string;
    symbol: string;
    targetPrice: number;
    condition: 'ABOVE' | 'BELOW';
    active: boolean;
    triggered: boolean;
    armed: boolean;
    expiresAt: Date;
    createdAt: Date;
}

const AlertSchema = new Schema<IAlert>(
    {
        userId: { type: String, required: true, index: true },
        symbol: { type: String, required: true, uppercase: true, trim: true },
        targetPrice: { type: Number, required: true },
        condition: { type: String, enum: ['ABOVE', 'BELOW'], required: true },
        active: { type: Boolean, default: true },
        triggered: { type: Boolean, default: false },
        armed: { type: Boolean, default: true },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```
Expected: exactly 2 pre-existing errors (both in nodemailer/reset-password,
unrelated to this file — the Inngest `createFunction` errors were fixed
in an earlier commit this session), nothing new.

- [ ] **Step 3: Commit**

```bash
git add database/models/alert.model.ts
git commit -m "Add armed field to Alert model for auto-rearm support"
```

---

### Task 2: `evaluateAlertState` — pure hysteresis logic, test-first

**Files:**
- Create: `lib/alerts/evaluate.ts`
- Test: `__tests__/alert-evaluate.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `evaluateAlertState(condition: 'ABOVE' | 'BELOW', targetPrice:
  number, currentPrice: number, armed: boolean): 'fire' | 'rearm' |
  'none'`. Task 3 imports this as `import { evaluateAlertState } from
  "@/lib/alerts/evaluate"` (static import at the top of
  `lib/inngest/functions.ts`, not a dynamic one — it's a pure function
  with no I/O).

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/alert-evaluate.test.ts
import { describe, expect, it } from 'vitest';
import { evaluateAlertState } from '@/lib/alerts/evaluate';

describe('evaluateAlertState', () => {
    describe('ABOVE condition', () => {
        it('fires when armed and price meets or exceeds target', () => {
            expect(evaluateAlertState('ABOVE', 100, 100, true)).toBe('fire');
            expect(evaluateAlertState('ABOVE', 100, 105, true)).toBe('fire');
        });

        it('does not fire when armed but price is below target', () => {
            expect(evaluateAlertState('ABOVE', 100, 99, true)).toBe('none');
        });

        it('does not fire when not armed, even if the condition is met', () => {
            expect(evaluateAlertState('ABOVE', 100, 105, false)).toBe('none');
        });

        it('rearms when unarmed and price falls 3% or more below target', () => {
            expect(evaluateAlertState('ABOVE', 100, 97, false)).toBe('rearm');
            expect(evaluateAlertState('ABOVE', 100, 90, false)).toBe('rearm');
        });

        it('stays unarmed when price has not cleared the 3% band', () => {
            expect(evaluateAlertState('ABOVE', 100, 98, false)).toBe('none');
        });
    });

    describe('BELOW condition', () => {
        it('fires when armed and price meets or drops below target', () => {
            expect(evaluateAlertState('BELOW', 100, 100, true)).toBe('fire');
            expect(evaluateAlertState('BELOW', 100, 95, true)).toBe('fire');
        });

        it('does not fire when armed but price is above target', () => {
            expect(evaluateAlertState('BELOW', 100, 101, true)).toBe('none');
        });

        it('does not fire when not armed, even if the condition is met', () => {
            expect(evaluateAlertState('BELOW', 100, 95, false)).toBe('none');
        });

        it('rearms when unarmed and price rises 3% or more above target', () => {
            expect(evaluateAlertState('BELOW', 100, 103, false)).toBe('rearm');
            expect(evaluateAlertState('BELOW', 100, 110, false)).toBe('rearm');
        });

        it('stays unarmed when price has not cleared the 3% band', () => {
            expect(evaluateAlertState('BELOW', 100, 102, false)).toBe('none');
        });
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/alert-evaluate.test.ts`
Expected: FAIL — `Cannot find module '@/lib/alerts/evaluate'`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/alerts/evaluate.ts
export type AlertCondition = 'ABOVE' | 'BELOW';
export type AlertOutcome = 'fire' | 'rearm' | 'none';

const REARM_BAND = 0.03; // 3%

export function evaluateAlertState(
    condition: AlertCondition,
    targetPrice: number,
    currentPrice: number,
    armed: boolean
): AlertOutcome {
    if (armed) {
        const fireConditionMet =
            condition === 'ABOVE' ? currentPrice >= targetPrice : currentPrice <= targetPrice;
        return fireConditionMet ? 'fire' : 'none';
    }

    const rearmConditionMet =
        condition === 'ABOVE'
            ? currentPrice <= targetPrice * (1 - REARM_BAND)
            : currentPrice >= targetPrice * (1 + REARM_BAND);
    return rearmConditionMet ? 'rearm' : 'none';
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/alert-evaluate.test.ts`
Expected: PASS, 10/10.

- [ ] **Step 5: Verify no new type errors**

```bash
npx tsc --noEmit
```
Expected: same 2-error baseline (nodemailer only), nothing new.

- [ ] **Step 6: Commit**

```bash
git add lib/alerts/evaluate.ts __tests__/alert-evaluate.test.ts
git commit -m "Add evaluateAlertState hysteresis logic for alert auto-rearm"
```

---

### Task 3: Wire `evaluateAlertState` into the price-alert cron

**Files:**
- Modify: `lib/inngest/functions.ts`

**Interfaces:**
- Consumes: `evaluateAlertState` from Task 2 (`@/lib/alerts/evaluate`),
  `armed` field on `Alert` from Task 1.
- Produces: no new exports — modifies `checkStockAlerts`'s internal
  behavior only. Its exported signature (`inngest.createFunction(...)`,
  id `'check-stock-alerts'`, cron `'*/5 * * * *'`) is unchanged.

- [ ] **Step 1: Add the static import**

```ts
// Before (top of lib/inngest/functions.ts):
import { inngest } from "@/lib/inngest/client";
import { NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT } from "@/lib/inngest/prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";
import { callAIProviderWithFallback } from "@/lib/ai-provider";
```
```ts
// After:
import { inngest } from "@/lib/inngest/client";
import { NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT } from "@/lib/inngest/prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";
import { callAIProviderWithFallback } from "@/lib/ai-provider";
import { evaluateAlertState } from "@/lib/alerts/evaluate";
```

- [ ] **Step 2: Change the fetch-active-alerts query to stop excluding already-triggered alerts**

Find this block inside `checkStockAlerts` (search for `'fetch-active-alerts'`):

```ts
// Before:
        const activeAlerts = await step.run('fetch-active-alerts', async () => {
            // Dynamic import to avoid circular dep issues if any, or just standard import
            const { connectToDatabase } = await import("@/database/mongoose");
            const { Alert } = await import("@/database/models/alert.model");

            await connectToDatabase();
            const now = new Date();

            return await Alert.find({
                active: true,
                triggered: false,
                expiresAt: { $gt: now }
            }).lean();
        });
```
```ts
// After:
        const activeAlerts = await step.run('fetch-active-alerts', async () => {
            // Dynamic import to avoid circular dep issues if any, or just standard import
            const { connectToDatabase } = await import("@/database/mongoose");
            const { Alert } = await import("@/database/models/alert.model");

            await connectToDatabase();
            const now = new Date();

            return await Alert.find({
                active: true,
                expiresAt: { $gt: now }
            }).lean();
        });
```

- [ ] **Step 3: Replace the condition-check loop (Step 4) to classify fire vs. rearm vs. none**

```ts
// Before:
        // Step 4: Check conditions
        type TriggeredAlert = { alert: any; currentPrice: number };
        const triggeredAlerts: TriggeredAlert[] = [];

        for (const alert of activeAlerts as any[]) {
            const currentPrice = prices[alert.symbol];
            if (!currentPrice) continue;

            let isTriggered = false;
            // Simple check
            if (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) {
                isTriggered = true;
            } else if (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice) {
                isTriggered = true;
            }

            if (isTriggered) {
                triggeredAlerts.push({ alert, currentPrice });
            }
        }
```
```ts
// After:
        // Step 4: Check conditions
        type EvaluatedAlert = { alert: any; currentPrice: number };
        const toFire: EvaluatedAlert[] = [];
        const toRearm: EvaluatedAlert[] = [];

        for (const alert of activeAlerts as any[]) {
            const currentPrice = prices[alert.symbol];
            if (!currentPrice) continue;

            const outcome = evaluateAlertState(alert.condition, alert.targetPrice, currentPrice, alert.armed);
            if (outcome === 'fire') {
                toFire.push({ alert, currentPrice });
            } else if (outcome === 'rearm') {
                toRearm.push({ alert, currentPrice });
            }
        }
```

- [ ] **Step 4: Replace the process-triggered-alerts step (Step 5) to handle both fires and rearms**

```ts
// Before:
        // Step 5: Process triggers
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

        return {
            processed: activeAlerts.length,
            triggered: triggeredAlerts.length
        };
```
```ts
// After:
        // Step 5: Process fires and rearms
        if (toFire.length > 0 || toRearm.length > 0) {
            await step.run('process-alert-state-changes', async () => {
                const { connectToDatabase } = await import("@/database/mongoose");
                const { Alert } = await import("@/database/models/alert.model");
                const { LineLink } = await import("@/database/models/lineLink.model");
                const { pushMessage } = await import("@/lib/line/client");
                await connectToDatabase();

                for (const { alert, currentPrice } of toFire) {
                    console.log(`🚀 ALERT FIRED: ${alert.symbol} is ${currentPrice} (${alert.condition} ${alert.targetPrice})`);

                    await Alert.findByIdAndUpdate(alert._id, { triggered: true, armed: false });

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

                for (const { alert } of toRearm) {
                    console.log(`🔄 ALERT REARMED: ${alert.symbol} (${alert.condition} ${alert.targetPrice})`);
                    await Alert.findByIdAndUpdate(alert._id, { armed: true });
                }
            });
        }

        return {
            processed: activeAlerts.length,
            fired: toFire.length,
            rearmed: toRearm.length
        };
```

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
npx vitest run
```
Expected: tsc shows the same 2-error baseline (nodemailer only), nothing
new; vitest shows the full suite passing including the 10 new tests from
Task 2, zero regressions.

```bash
npm run build
```
Expected: succeeds (requires a live MongoDB connection for static
generation — if Atlas is unreachable from this network at the time you
run this, that's the known pre-existing environment issue documented
elsewhere in this project's history, not something this task caused).

- [ ] **Step 6: Commit**

```bash
git add lib/inngest/functions.ts
git commit -m "Rearm price alerts instead of firing once and deactivating"
```

---

### Task 4: Deploy and verify against the live 69 alerts

**Files:** none (deploy + verification only)

- [ ] **Step 1: Deploy to Vercel production**

```bash
npx --cache /tmp/npm-cache-openstock vercel --prod --yes
```
Expected: `readyState: READY`.

- [ ] **Step 2: Confirm the deployment is live**

```bash
curl -s -o /dev/null -w "sign-in: %{http_code}\n" https://tonklasocute.vercel.app/sign-in
```
Expected: `200`.

- [ ] **Step 3: Spot-check a few live alerts against the new logic**

Query a few of the 69 alerts created earlier this session (e.g. via a
one-off script against `MONGODB_URI`, matching the pattern used earlier
in this session's conversation to inspect the `alerts` collection
directly) and confirm each now has `armed: true` (Mongoose's schema
default applies to documents that predate this field, so no explicit
migration write is needed — but confirm this is actually true by reading
a few documents back, not just asserting it from the schema default
alone).

- [ ] **Step 4: Report to the user**

Summarize what changed, and remind them that Inngest Cloud still needs
the manual re-sync (from the still-open thread about "A trigger must
supply an event name or a cron schedule" / unattached syncs) pointed at
`https://tonklasocute.vercel.app/api/inngest` before any of this — old or
new alert behavior — actually runs on a schedule in production.
