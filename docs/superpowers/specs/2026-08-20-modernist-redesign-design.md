# Modernist Redesign — Design

## Goal

Apply the `design_handoff_stock_redesign/` handoff to the live app: retheme
every screen (sign in, sign up, dashboard, watchlist, stock detail, alerts)
from the current dark pastel-pink theme onto the **Modernist** design system —
flat, gridded, near-mono red-on-white, zero border radius, 2px rules, Archivo
type. High-fidelity handoff; this is a reskin of already-functional screens,
not new backend/data work.

## Decisions made during brainstorming

- **Rollout**: all screens in one pass (not phased, not a single pilot screen).
- **Dashboard direction**: option **1c "Grid & table"** (4 index cards + full
  watchlist data table with sparklines) — not 1d "Chart-led".
- **Stock detail direction**: option **1f "Split w/ sidebar"** (chart + stats
  left, price-alert/related/news sidebar right) — not 1e "Full-width". Matches
  the app's existing two-column layout best.
- **Integration approach**: retheme the existing Tailwind/shadcn stack's CSS
  custom properties and component classes, rather than porting the handoff's
  plain `styles.css` and rewriting markup to its literal classes (`.btn`,
  `.field`, `.seg`, …). Keeps shadcn/Radix components (Select, Dialog, Avatar)
  for behavior/accessibility; only their visual styling changes.
- **TradingView-embedded pages** (dashboard, stock detail): discovered during
  exploration that these pages are almost entirely built from TradingView
  iframe widgets (market overview, heatmap, candle chart, technical analysis,
  company profile, financials), which render their own internal chrome and
  cannot be pixel-matched to Modernist tokens. Decision: **reskin the chrome
  only** — page background, nav, headers, the cards/frames wrapping each
  widget, `WatchlistButton`, `StockSentimentCard` — and leave widget internals
  as their own light-themed embeds. Do not rebuild charting/dashboard as
  custom components fed by real data (that was the rejected, larger-scope
  alternative).
- **Structural changes from the handoff are in scope**, not just color: the
  handoff's sign-up screen specifies radio buttons / a segmented control / tag
  chips for Investment Goals / Risk Tolerance / Preferred Industry (current
  app uses three `<Select>` dropdowns for these), and its alerts screen
  specifies a segmented control for Above/Below (current app uses a
  `<Select>`). Approved as-is — these get rebuilt as specified, not left as
  dropdowns.
- **Icons**: reuse `lucide-react` (already a dependency, already 2px stroke by
  default, matching the handoff's hand-authored SVG spec) — no new icon
  library, no hand-authored SVGs.
- **Dark mode**: dropped. Modernist is single-theme and the app has no
  dark-mode toggle to preserve (confirmed during the prior rebrand — the
  `.dark` class is unused; theming is entirely via `:root` token values).

## Token layer — `app/globals.css`

This is the single highest-leverage change: the app's custom `@theme` block
already centralizes color as named tokens (`--color-gray-900`…`100`,
`--color-teal-*`, `--color-yellow-*`, `--color-red-500`, `--color-blue-600`,
`--color-orange-500`, `--color-purple-500`) that 300+ call sites reference via
Tailwind classes (`bg-gray-900`, `text-teal-400`, …) rather than hardcoded
hex. Remapping the token *values* flips most of the app in one file.

**shadcn/Radix `:root` tokens** (`--background`, `--foreground`, `--card`,
`--primary`, `--border`, `--input`, `--ring`, `--radius`, etc.) — replace with
Modernist equivalents:

| Token | New value | Source |
|---|---|---|
| `--background` | `#f3f2f2` | `--color-bg` |
| `--foreground` | `#201e1d` | `--color-text` |
| `--card` | `#eae9e9` | `--color-surface` |
| `--primary` | `#ec3013` | `--color-accent` |
| `--primary-foreground` | `#f3f2f2` | `--color-bg` |
| `--border` / `--input` | `color-mix(in srgb, #201e1d 40%, transparent)` | `--color-divider` |
| `--radius` | `0rem` | flat everywhere |

Delete the `.dark { … }` block entirely (dead code per the dropped-dark-mode
decision — nothing toggles it).

**Extended gray/vibrant `@theme` block** — replace with the Modernist neutral
and accent ramps so every existing `gray-*`/`teal-*`/`yellow-*`/`red-500`
class site flips automatically:

| Token | New value | Used for |
|---|---|---|
| `--color-gray-900` | `#f3f2f2` (bg) | page background |
| `--color-gray-800` | `#eae9e9` (surface) | card/header surface |
| `--color-gray-700` | `#d7d3d3` (neutral-300) | subtle borders/hover bg |
| `--color-gray-600` | `color-mix(#201e1d 40%, transparent)` (divider) | default borders |
| `--color-gray-500` | `#7d7979` (neutral-600) | muted/secondary text |
| `--color-gray-400` | `#201e1d` (text) | primary body text |
| `--color-gray-300` | `#444141` (neutral-800) | headings on light bg |
| `--color-gray-200` | `#2d2b2b` (neutral-900) | headings on light bg |
| `--color-gray-100` | `#201e1d` (text) | headings on light bg |
| `--color-teal-400` / `500` | `#ec3013` / `#dd2b0f` (accent / accent-600) | primary accent (was brand teal) |
| `--color-teal-300` / `600` | `#ff9783` / `#ae1800` (accent-400/700) | accent hover/active variants |
| `--color-yellow-400` / `500` | `#ec3013` / `#dd2b0f` (accent / accent-600) | primary CTA button (`.yellow-btn`) |
| `--color-red-500` | `#ec3013` | danger/remove actions (Modernist has one accent, reused for danger) |
| `--color-blue-600`, `--color-orange-500`, `--color-purple-500` | unused after sweep (step below removes their call sites) — leave defined as accent-2 tone (`#e15b47`) for safety, not actively referenced |

**Font**: replace `Geist`/`Geist Sans` with `Archivo` (weights 400/600/800)
via `next/font/google` in `app/layout.tsx`, same pattern as the existing
`Geist`/`Geist_Mono` setup. Drop `Geist_Mono` (only used for
`--font-geist-mono`, not referenced by any component class). Update
`--font-sans` mapping in the `@theme inline` block to the new Archivo
variable.

**Global resets** (add to `globals.css`, ported from the handoff's
`styles.css`): heading scale/weight (`h1` 42px … `h6` 13px uppercase, weight
800, `-0.015em` letter-spacing), `:focus-visible` uses a 2px accent outline,
`::selection` accent-tinted.

## Shared component classes — `app/globals.css` `@layer utilities`

Rewrite each of the ~40 existing classes to the flat/0-radius/2px-rule look,
reusing the tokens above. No new classes needed — same names, same call
sites, new declarations. Notable ones: `.yellow-btn` (primary CTA — solid
accent bg, 0 radius, no gradient/shadow), `.form-input`/`.select-trigger`
(flat 1px divider border, 0 radius, accent focus border — no ring), `.header`
(2px bottom divider instead of shadow), `.watchlist-table`/`.table-header-row`/
`.table-row` (collapse borders, 1px row rules, 2px header rule, uppercase
11px letter-spaced header text — matches handoff `.table`), `.alert-dialog`/
`.alert-item` (flat surface, 0 radius, no gradient badges), `.news-item`/
`.news-tag` (flat card, accent-outline tag), `.search-dialog`/`.search-item`
(flat, 0 radius).

## Hardcoded-utility sweep

Steps above don't cover literal one-off Tailwind classes that bypass the
token system — these need direct file edits (grep for `rounded-`, `shadow-2xl`,
`shadow-lg`, `backdrop-blur`, `bg-gradient-to-`, `bg-\[#`, `black/`, `white/`,
raw `green-400`/`500`, `red-400` change-indicator colors):

- **`components/watchlist/WatchlistTable.tsx`** — replace `rounded-xl`
  wrapper, `rounded-full` gradient avatar fallback, `backdrop-blur-md`,
  `shadow-xl`, `black/10`/`white/70` borders with flat Modernist card + 0
  radius. Change pill: currently `bg-green-500/10 text-green-400` /
  `bg-red-500/10 text-red-400` with `ArrowUp`/`ArrowDown` → accent-tinted pill
  + `ChevronUp` for positive, neutral pill + `ChevronDown` for negative (per
  handoff's "up-chevron accent pill / down-chevron neutral pill" spec, reused
  everywhere a change appears).
- **`components/watchlist/CreateAlertModal.tsx`** — dialog surface/border to
  `.dialog`-equivalent flat card; primary button (`bg-[#FACC15]` hardcoded
  hex) → accent solid button, 0 radius, no glow shadow; **Condition** field
  changes from `<Select>` (Greater than / Less than) to a 2-option segmented
  control (Above/Below) per handoff screen 1h.
- **`components/watchlist/AlertsPanel.tsx`** — flat surface, drop gradient
  avatar badges, status handling: map alert state to `.tag-accent` (Active),
  `.tag-outline` (Triggered), `.tag-neutral` (Paused) per handoff's status-tag
  mapping (currently no status tag rendered — add it, data already carries an
  alert status).
- **`components/watchlist/ConnectLineCard.tsx`**, **`WatchlistManager.tsx`**,
  **`WatchlistStockChip.tsx`**, **`NewsGrid.tsx`**, **`SearchCommand.tsx`**,
  **`UserDropdown.tsx`**, **`components/stocks/StockSentimentCard.tsx`**,
  **`Footer.tsx`**, **`WatchlistButton.tsx`** — same sweep: 0 radius, flat 1–2px
  borders instead of shadows/blur/gradients, accent instead of teal/yellow.
- **`components/Logo.tsx`** — mark recolors from teal/pink to accent
  (`#ec3013`); no shape change needed, this is a color-only token swap
  (`Logo.tsx` already takes color from a CSS class, not a hardcoded fill —
  confirm at implementation time and adjust if it hardcodes a hex).

## Screen-specific structural changes

- **`app/(auth)/layout.tsx` + `sign-in`/`sign-up` pages** — keep the existing
  two-column skeleton (`auth-left-section`/`auth-right-section`, already
  structurally close to handoff screens 1a/1b). Right panel's "Market
  Overview" card restyles from the pink-gradient SVG card to the Modernist
  `.tag.tag-outline` + accent-line chart treatment described in the handoff.
  `.yellow-btn` primary CTA restyles via the token/class changes above (no
  markup change needed).
- **`app/(auth)/sign-up/page.tsx`** — replace `<SelectField investmentGoals>`
  with a 3-option radio group, `<SelectField riskTolerance>` with a 3-way
  segmented control, `<SelectField preferredIndustry>` with multi-select tag
  chips (first 2 pre-selected accent, rest neutral) per handoff screen 1b.
  Form data shape / `SignUpFormData` stays the same (single value each for
  goals/risk, array for industry — confirm current `preferredIndustry` is
  already multi-select-capable or needs a minor type widen at implementation
  time).
- **`app/(root)/watchlist/page.tsx`** — header row gets the All/Gainers/Losers
  segmented filter from handoff screen 1g (not currently present — new but
  small piece of client-side filter logic over already-fetched watchlist
  data, no new data fetching). Table restyles to `.table` look via the
  component-class + sweep changes above; sparkline column added if the
  watchlist data already carries 7-day history, otherwise omitted (existing
  columns — Symbol/Sector/Price/Change — restyle in place, no sparkline
  fabricated from missing data).
- **`app/(root)/page.tsx` (dashboard)** and
  **`app/(root)/stocks/[symbol]/page.tsx`** (stock detail) — chrome-only:
  page background, section spacing/2px dividers, and the card frame wrapping
  each `TradingViewWidget` restyle to Modernist; `WatchlistButton` and
  `StockSentimentCard` restyle via the sweep above. Widget internals
  (iframe content) are untouched — keep the existing forced-white-background
  CSS overrides in `globals.css` (`.tradingview-widget-container`, etc.)
  since the widgets need a light background regardless and can't take the
  exact `#f3f2f2`/Archivo treatment.
- **`components/Header.tsx`**, **`components/NavItems.tsx`** — restyle to
  `.nav`-equivalent: 2px bottom divider instead of shadow, accent
  underline/color on active/hover link (`nav a:hover`), same structure
  (logo left, nav center, user menu right).
- **`components/Footer.tsx`** — flat 2px top divider, links restyle from
  `hover:text-teal-400` to accent hover (mostly covered by the token swap).

## Out of scope

- Rebuilding TradingView chart/dashboard internals as custom SVG
  charts/components fed by real data (the rejected larger-scope alternative)
  — widgets stay third-party embeds, chrome-only reskin around them.
- New backend/data wiring — every screen is already functionally wired to
  real data (Finnhub, better-auth, watchlist/alert actions); this is a
  visual + specified-interaction reskin only.
- Dark mode / theme toggle.
- Pixel-matching TradingView widget internals to the Modernist palette — not
  achievable, widgets only accept a light/dark toggle.

## Testing plan

No functional/data-layer changes, so existing `vitest` suite should be
unaffected — run `npm test` to confirm no regressions from component
restructuring (e.g. sign-up's dropdowns → radio/segmented/chips could affect
any test that queries by role/label). Then:

1. `npm run build` — confirm no type/lint errors from the class/markup changes.
2. Start the dev server and manually walk each of the 8 screens, comparing
   against the handoff's `Tonkla Redesign.dc.html` (open in browser) for
   token fidelity (0 radius everywhere, 2px dividers, Archivo type, single red
   accent) and the specified interaction changes (sign-up radios/segmented/
   chips, alert condition segmented control, watchlist filter segmented
   control, status tag mapping on alerts).
3. Spot-check the TradingView-embedded pages (dashboard, stock detail) for
   chrome/widget visual coherence — widgets stay white/light, surrounding
   chrome is Modernist; flag if the contrast reads oddly rather than trying
   to force a pixel match.
