# tonklasocute Rebrand — Design

## Goal

Rebrand this OpenStock fork into the user's own product, "tonklasocute": new name, new
mascot logo, and a light pastel-pink theme, while staying compliant with the AGPL-3.0
license the upstream project ships under (must keep source-available + credit the
original authors).

## Decisions made during brainstorming

- Full rebrand: name + logo everywhere (not just cosmetic tweaks).
- Name: **tonklasocute** (lowercase, no spaces), replaces "OpenStock" in all
  user-facing UI text (header, footer, page titles/metadata, body copy).
- Logo: new mascot — pink circle with a simple smiling face (option "B" from the
  visual review), replacing the raster `logo.png`.
- Theme: **Light & Cute** — white/pale-pink background, pink primary accent
  (replacing the current all-dark theme with teal accent). Approved via a full
  sign-in page mockup (white form panel + pastel-pink info panel with a small
  "Market Overview" chart card).
- AGPL credit: keep a **small text credit line** — "Built with OpenStock · Open
  Dev Society" — in the footer, linking to the upstream repo. Not shown on every
  page, no logo/badge graphic.
- Remove entirely: the sign-in/sign-up testimonial quote (Ravi Pratap Singh /
  Open Dev Society founder), the "Live on Peerlist Launchpad" badge, and the old
  GitHub repo link on the auth pages.
- Also remove (found during implementation planning, same category as the above
  — third-party sponsor promo not applicable to this fork): the "Reliably backed
  by Siray.ai" banner shown at the top of every page after login
  (`components/SirayBanner.tsx`).
- Out of scope: README.md / API_DOCS.md / MARKET_SUPPORT.md (developer-facing
  docs — keep accurate references to the real upstream project; not part of "the
  website").

## Visual identity

**Logo** — `components/Logo.tsx`, a small inline-SVG component (no new image
asset/tooling needed):

```
<circle> pink fill (#f472b6)
  two dot eyes (background-color)
  one curved smile path (background-color)
<span>tonklasocute</span>  -- optional wordmark, system-ui, font-weight 800
```

Props: `size` (default 34), `showWordmark` (default true), `className`. Replaces
every `<Image src="/assets/images/logo.png">` usage. Also written as a static
`app/icon.svg` (Next.js auto-favicon convention) so the browser tab gets the new
mark — `app/favicon.ico` stays as a fallback for old browsers (not regenerated;
pixel .ico editing needs tooling we don't have — acceptable minor gap).

**Color tokens** — the entire dark theme is centralized in one place,
`app/globals.css`'s `@theme` block (lines ~114–131: `--color-gray-*` and
`--color-teal-*`). Every component uses these via Tailwind classes
(`bg-gray-900`, `text-gray-400`, `border-gray-600`, `text-teal-400`, etc. — 300+
occurrences across the codebase) rather than hardcoded colors, so retheming is a
single-file token swap, not a component-by-component rewrite:

| Token | Old (dark) | New (light) | Used for |
|---|---|---|---|
| `--color-gray-900` | `#050505` | `#FDF2F8` | page background |
| `--color-gray-800` | `#141414` | `#FFFFFF` | card/header surface |
| `--color-gray-700` | `#212328` | `#FCE7F3` | subtle borders/hover bg |
| `--color-gray-600` | `#30333A` | `#FBCFE8` | input/default borders |
| `--color-gray-500` | `#9095A1` | `#6B7280` | muted/secondary text |
| `--color-gray-400` | `#CCDADC` | `#1F2937` | primary body text |
| `--color-teal-400` | `#0FEDBE` | `#F472B6` | accent (links, icons) |
| `--color-teal-500` | `#0FEDBE` | `#EC4899` | accent (buttons, hover) |

Also **add** `--color-gray-300/200/100` (currently undefined — those classes
silently fall back to Tailwind's stock near-white gray palette, which reads fine
as "bright heading text on a dark page" today but would be invisible on the new
white/pale-pink background). Set all three to dark values (e.g. `#374151`,
`#111827`, `#0B0F19`) so headings stay legible after the flip.

`yellow-btn` (the primary CTA button class) needs no change — it already uses
`text-gray-800` for its label, which becomes white under the new mapping, reading
correctly on the pink gradient button.

Not touched: `yellow-*`, `red-500`, `blue-600`, `purple-500` tokens — these are
used for semantic/status colors (alerts, danger, external-link accents), not the
primary brand color, and already read fine on a light background.

**Manual outliers** — two files bypass the token system with hardcoded near-black
hex values and need direct edits: `components/watchlist/CreateAlertModal.tsx`
(`bg-[#0A0A0A]`, `bg-[#1C1C1F]` → light equivalents, e.g. `bg-white` /
`bg-[#FDF2F8]`, plus their paired `text-white`/`text-gray-200` → dark text) and
`app/(root)/api-docs/page.tsx` (same `#0A0A0A` pattern, one spot).

`html` currently has a hardcoded `className="dark"` in `app/layout.tsx` — this
predates any real light/dark toggle (there's no `ThemeProvider` wired up despite
`next-themes` being a dependency; the whole app is dark purely via the token
values above, not via the `.dark` CSS selector). Remove `className="dark"` so it
doesn't accidentally trip the separate `.dark { ... }` block's shadcn tokens
(`--background`, `--card`, etc., used by a handful of shadcn primitives) — those
also need their light-mode `:root` values confirmed to read fine (they already
default to a light palette in `:root`, since `:root` was always light — only
`.dark` overrides it dark. Removing the class means `:root`'s existing light
shadcn tokens apply, which is what we want, no changes needed there).

## Component changes

- **`components/Header.tsx`** — swap `<Image logo.png>` for `<Logo />`.
- **`components/Footer.tsx`** — swap logo (drop the `brightness-0 invert` filter,
  no longer needed on a white logo/white card); replace the brand paragraph with
  tonklasocute's description; drop the "Learn about our mission" link and the
  LinkedIn/Discord community links (Open Dev Society's own channels, not
  tonklasocute's); replace the `OpenDevSocietyBranding` graphic + "© Open Dev
  Society" line with: `© {year} tonklasocute · Built with OpenStock` where
  "OpenStock" links to `https://github.com/Open-Dev-Society/OpenStock`.
- **`components/OpenDevSocietyBranding.tsx`** — delete. After the footer change
  above and the auth-page removals below, nothing references it.
- **`components/DonatePopup.tsx`** and its usage in `app/(root)/layout.tsx`
  (via `NavItems.tsx`) — remove. It solicits donations to the original author's
  personal GitHub Sponsors (`github.com/sponsors/ravixalgorithm`), which doesn't
  make sense pointed at a visitor of tonklasocute. Delete the component and its
  render call.
- **`app/(auth)/layout.tsx`** — swap logo for `<Logo />`; replace the entire
  right-panel content (testimonial quote, star rating, `dashboard.png`
  screenshot) with the approved mockup: mascot icon + one-line tagline + a small
  inline-SVG "Market Overview" chart card (static illustrative data, matches the
  approved mockup — not a live widget).
- **`app/(auth)/sign-in/page.tsx`**, **`sign-up/page.tsx`** — remove the
  `OpenDevSocietyBranding` call and the Peerlist embed `<img>`/link block.
- **`app/(auth)/forgot-password/page.tsx`**,
  **`app/(auth)/reset-password/ResetPasswordForm.tsx`** — remove the
  `OpenDevSocietyBranding` call (no replacement needed; credit lives in the
  footer on the rest of the site).
- **`app/(root)/page.tsx`** — remove the "Upvote us on Peerlist" embed section.
- **`app/layout.tsx`** — `metadata.title`/`description` → tonklasocute copy;
  drop `className="dark"` on `<html>`.
- **`app/(root)/terms/page.tsx`**, **`app/(root)/help/page.tsx`**,
  **`app/(root)/api-docs/page.tsx`** — mechanical product-name swap
  ("OpenStock" → "tonklasocute") in titles/metadata/body copy; these pages'
  actual content (terms, FAQ, architecture docs) stays accurate to what the app
  does. On the help page, drop the "open an issue on GitHub" support link (no
  support channel of our own exists yet) rather than pointing it at the upstream
  repo's issue tracker.
- **`app/(root)/about/page.tsx`** — add a short new intro section about
  tonklasocute itself at the top; keep the existing Open Dev Society
  origin-story/manifesto content below, relabeled under a clear "Powered by
  Open Dev Society" heading rather than rewritten — it's their own history and
  words, not tonklasocute's, so it gets attributed rather than repurposed.
- **`package.json`** — `name` field `"Openstock"` → `"tonklasocute"` (cosmetic,
  package is private/unpublished, zero functional risk).

## Testing plan

No visual browser tooling is available in this environment (no chromium-cli/
Playwright installed, and `screencapture` can't see real windows here — hit this
limitation earlier in the session). Verification will be:

1. `npm run build` / dev server boots without type or lint errors.
2. `curl` each changed route (`/`, `/sign-in`, `/sign-up`, `/about`, `/terms`,
   `/help`, `/api-docs`) for HTTP 200 and grep the HTML for the new brand string
   ("tonklasocute") and absence of the old one ("OpenStock" outside the intended
   footer credit / about-page attribution / doc pages).
3. Ask the user to eyeball it live in their own browser (as done earlier in this
   session) since that's the only way to actually see the visual result here.

## Out of scope

- README.md, API_DOCS.md, MARKET_SUPPORT.md — developer docs, left accurate to
  the real upstream project.
- Regenerating `favicon.ico` as a pixel-perfect match (no image tooling here);
  `app/icon.svg` covers modern browsers.
- Re-theming TradingView embedded widgets (heatmap, charts, quotes) — these are
  third-party iframes that only accept a `light`/`dark` toggle, not custom brand
  colors. They'll render in their own light theme, which reads fine next to the
  new light page background but won't be pixel-matched to the pink palette.
