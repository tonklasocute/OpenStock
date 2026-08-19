# Price Alert Auto-Rearm — Design

## Goal

Today a price alert fires exactly once, ever: the moment its condition is
met, it's marked `triggered: true, active: false` and the 5-minute cron
never looks at it again — even if the price crosses back and forth across
the target repeatedly over following days. Change this so an alert can
fire again after the price genuinely moves away from the target and comes
back, instead of being a permanent one-shot.

## The flapping problem, and the fix

A naive "just remove the one-shot deactivation" would spam a notification
every 5 minutes while the price hovers within a few cents of the target.
The fix is a hysteresis band: after firing, an alert must see the price
move a real distance *away* from the target — in the direction that
un-does the trigger condition — before it's allowed to fire again. Decided
during brainstorming: **3%** away from the target price.

- **BELOW** alert (target `T`, e.g. a support level): fires when price
  `<= T`. After firing, re-arms (silently, no notification) once price
  rises to `>= T * 1.03`. Only once re-armed can it fire again on a future
  dip back to `<= T`.
- **ABOVE** alert (target `T`, e.g. a resistance level): fires when price
  `>= T`. Re-arms once price falls to `<= T * 0.97`.

## Data model change

`database/models/alert.model.ts` — add one field:

```
armed: { type: Boolean, default: true }
```

`triggered` stays as-is, now meaning "has fired at least once" (still
useful for the UI/history), not "is this alert still live." `active`
keeps its existing meaning (user can still manually disable/delete via
the trash icon already in `AlertsPanel`) — it is simply no longer set to
`false` automatically on trigger.

## Cron logic change

`lib/inngest/functions.ts`, `checkStockAlerts`:

- Query changes from `{ active: true, triggered: false, expiresAt: {
  $gt: now } }` to `{ active: true, expiresAt: { $gt: now } }` — no
  longer excludes already-triggered alerts, since they can fire again.
- For each fetched alert, per current price:
  - If `armed` and the fire condition is met (`ABOVE`: `price >=
    targetPrice`; `BELOW`: `price <= targetPrice`) → send the LINE
    notification (same message format as today), set `triggered: true,
    armed: false`.
  - Else if not `armed` and the re-arm condition is met (`ABOVE`: `price
    <= targetPrice * 0.97`; `BELOW`: `price >= targetPrice * 1.03`) → set
    `armed: true`. No notification — this is a silent state reset.
  - Else → no change.

This applies uniformly to every alert already in the database (including
the 69 created earlier this session) — there's no separate "legacy
one-shot" vs "new rearming" alert type. Nothing about `createAlert`,
`deleteAlert`, `toggleAlert`, or the Watchlist/Alerts UI changes.

## Testing

No test currently exists for `checkStockAlerts`'s trigger-condition logic
(it's untested Inngest function code, matching this repo's existing
convention of not unit-testing Inngest functions directly). The state
transition logic (armed → fired → re-armed) is a pure function of
`(condition, targetPrice, currentPrice, armed)` — worth extracting into a
small testable helper rather than leaving it inline, since it's the one
part of this change with real branching logic worth verifying:

```ts
function evaluateAlertState(
  condition: 'ABOVE' | 'BELOW',
  targetPrice: number,
  currentPrice: number,
  armed: boolean
): 'fire' | 'rearm' | 'none'
```

This function is pure (no I/O), lives well as a named export next to
`checkStockAlerts` in `lib/inngest/functions.ts` or in a new tiny
`lib/alerts/evaluate.ts` — the plan will decide the exact placement — and
gets unit tests in `__tests__/` following this repo's vitest conventions,
covering: fires when armed and condition met, does not fire when not
armed even if condition met, re-arms when unarmed and price clears the 3%
band, stays unarmed when price hasn't cleared the band yet, no-ops when
armed and condition not met.

## Out of scope

- No per-alert opt-out of rearming — every alert behaves the same way.
- No UI change — the existing "Active until {90 days}" copy and delete
  button already fully cover what a user needs to manage a rearming
  alert.
- No configurable hysteresis percentage — 3% is a fixed constant.
