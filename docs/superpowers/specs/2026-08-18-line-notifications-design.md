# LINE Notifications — Design

## Goal

Send two kinds of LINE messages to users who opt in: (1) a real-time push
when a price alert they set actually triggers (today this silently does
nothing — a pre-existing gap, not something this feature regresses), and
(2) a daily digest at 8:00 Thai time (01:00 UTC) listing their watchlist's
current prices plus a few relevant news headlines.

Email is explicitly out of scope for this feature (decided during
brainstorming) — the existing unused email templates/scaffolding stay as
they are, untouched.

## Why LINE Messaging API, not LINE Notify

LINE Notify (the simple one-token-per-user service) was shut down by LINE
on 2025-03-31. The only remaining path is the **LINE Messaging API**
through a LINE Official Account (LOA), which the user will create fresh —
none exists yet. This requires a channel access token + channel secret,
and every recipient must have added the OA as a friend before the app can
message them.

## Account linking (no OAuth)

Rather than a full LINE Login (OAuth) integration — a second LINE channel
type and a redirect flow — this uses a lighter linking-code scheme:

1. User opens the Watchlist page. The Alerts panel shows a "Connect LINE"
   card when they have no linked LINE account.
2. They click "Generate code" → a server action creates a 6-digit code
   valid for 10 minutes and shows it alongside an add-friend
   link/QR for the LOA (built from a `LINE_OA_ID` env var, e.g.
   `https://line.me/R/ti/p/@xxxxx`).
3. They add the OA as a friend in LINE and send the 6-digit code as a
   plain text message.
4. A webhook receives that message, verifies it's really from LINE
   (HMAC-SHA256 signature check using the channel secret), matches the
   code to a pending link, records the sender's LINE user ID against the
   account, and replies "เชื่อมต่อสำเร็จ ✅" confirming the link.
5. The Watchlist page (on next load) shows "Connected" in place of the
   card.

No LINE Login channel, no OAuth redirect, no extra LINE Developers console
setup beyond the one Messaging API channel — matches the scope the user
confirmed.

## Data model

New collection, decoupled from better-auth's `User` schema (approved
during brainstorming — safer than extending better-auth's own schema):

```
database/models/lineLink.model.ts

LineLink {
  userId: string (unique index)
  lineUserId: string | null
  linkCode: string | null
  linkCodeExpiresAt: Date | null
  linkedAt: Date | null
}
```

## Components

- **`lib/line/client.ts`** — thin LINE Messaging API wrapper:
  `verifySignature(rawBody, signatureHeader)`, `replyMessage(replyToken,
  text)`, `pushMessage(lineUserId, text)`. Pure functions where possible
  (signature verification needs no network call, is unit-testable).
- **`lib/actions/lineLink.actions.ts`** — server actions:
  `generateLinkCode(userId)` (creates/overwrites the pending code + expiry
  on that user's `LineLink` doc, upserting if none exists yet),
  `getLineLinkStatus(userId)` (returns whether linked, for the UI card).
- **`app/api/line/webhook/route.ts`** — Next.js route handler for LINE's
  webhook. Verifies the signature first (reject with 401 if it fails,
  before touching the DB), then handles a `message`/`text` event: look up
  a `LineLink` with matching `linkCode` and `linkCodeExpiresAt > now`,
  set `lineUserId`/`linkedAt`, clear the code, reply via
  `replyMessage`. Any other event type (follow, unfollow, non-matching
  code) is acknowledged with 200 and otherwise ignored — LINE requires a
  200 response promptly or it retries.
- **`components/watchlist/ConnectLineCard.tsx`** — new component rendered
  inside `AlertsPanel` (per the approved UI placement): shows the connect
  flow when unlinked, a small "Connected ✓" badge when linked.
- **`lib/inngest/functions.ts`** — two changes:
  - Existing `checkStockAlerts` (the `*/5 * * * *` cron): after marking an
    alert `triggered`, look up `LineLink` by `alert.userId`; if
    `lineUserId` is set, call `pushMessage()` with the trigger details.
    If not linked, do nothing (unchanged from today — no email fallback,
    per the explicit scope decision).
  - New `sendDailyLineDigest`, cron `0 1 * * *` (01:00 UTC = 08:00
    Thailand): iterate `LineLink` docs where `lineUserId` is set; for each,
    call the existing `getUserWatchlist(userId)` — skip if empty; fetch
    live prices via the existing `getWatchlistData(symbols)` (already used
    by `WatchlistTable`'s polling) and headlines via the existing
    `getNews(symbols)` (already filters by symbol, used by the
    scaffolded-but-unwired per-user email path); format one plain-text
    LINE message (watchlist prices, capped at a readable number of lines,
    then 3-5 news headlines); `pushMessage()`.
- **`app/api/inngest/route.ts`** — register the new `sendDailyLineDigest`
  function alongside the existing ones so Inngest picks it up.

## Error handling

A failed `pushMessage` call (expired token, user unfriended the OA, etc.)
is caught and logged per-recipient — it must not abort the rest of the
cron run (other users' alerts/digests still need to process). The webhook
route always returns 200 for events it doesn't act on (LINE retries
non-200 responses, which would otherwise cause duplicate processing).

## New environment variables

```
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
LINE_OA_ID=          # e.g. @abc1234, used to build the add-friend link/QR
```

## Testing

No live LINE webhook testing is possible right now — LINE requires a
public HTTPS URL, and the user is deferring that until this is deployed to
Vercel (decided during brainstorming). What ships testable now:

1. `verifySignature` — pure function, unit-testable with a fixed
   secret/body/signature triple (following this repo's existing
   `__tests__/*.test.ts` vitest conventions).
2. The webhook route handler's matching logic (find-by-code,
   expiry check) — testable by calling the handler function directly with
   a constructed request body, mocking the DB layer the same way existing
   `__tests__/adanos.actions.test.ts`-style tests mock actions.
3. `npx tsc --noEmit` / `npm run build` for the rest — same as every prior
   task in this project.
4. A manual post-deploy checklist (add-friend, send code, confirm reply,
   trigger a test alert, wait for the next digest window) — handed to the
   user, not something this session can execute.

## Out of scope

- Email notifications (explicitly deferred by the user).
- LINE Flex Message rich cards — v1 sends plain text; upgrading the digest
  to a Flex card is a clean follow-up once the plain-text version is
  proven working.
- A UI to disconnect/re-link LINE, or to customize digest timing per user
  — single fixed daily time for everyone, no settings page.
- Rate-limit handling for LINE's own API quotas — the free tier's monthly
  push message quota is a real constraint at scale, but not one to design
  around before this ships at all.
