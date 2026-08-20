# Handoff: Tonkla Stock Watchlist — Redesign

## Overview
Redesign of a free stock watchlist & price-alert web app (originally at tonklasocute.vercel.app), covering sign in, sign up/onboarding, dashboard, stock detail, watchlist, and price alerts. Built on the **Modernist** design system: flat, gridded, near-mono red-on-white, zero border radius, strong 2px rules.

## About the Design Files
The files in this bundle are **design references built in HTML** (a single "Design Component" file plus its stylesheet) — prototypes showing intended look and behavior, not production code to copy directly. The task is to **recreate these HTML designs in the target codebase's existing environment** (React, Vue, native, etc.) using its established patterns and libraries — or, if no environment exists yet, to choose the most appropriate framework and implement the designs there.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and component styling are final per the Modernist design system's tokens (see Design Tokens below). Copy shown (stock tickers/prices/names) is placeholder sample data — wire up to real market data.

Note: two directions are provided for the Dashboard (options labeled 1c "Grid & table" and 1d "Chart-led") and two for Stock Detail (1e "Full-width" and 1f "Split with sidebar"). Pick one direction per screen for implementation, or ask the design owner which to ship.

## Screens / Views

### 1. Sign In (option 1a)
- **Purpose**: Existing user authentication.
- **Layout**: Two-column grid, 1fr/1fr, min-height 640px. Left column: centered form (max-width 380px) with a 2px right divider. Right column: surface-tinted panel (`--color-surface`) showing a "MARKET OVERVIEW" tag, a large AAPL price with a chart, and Thai marketing copy anchored to the bottom.
- **Components**: Email field, password field, "Forgot password?" link, primary block button "Sign In", secondary link "Create an account". Right panel: `.tag.tag-outline`, price in `--font-heading` 44px/800, a positive change pill (accent-tinted, up-arrow icon), and a 420×140 SVG line+area chart.

### 2. Sign Up & Personalize (option 1b)
- **Purpose**: New account creation with onboarding preferences in one flow.
- **Layout**: Two-column grid, 1fr/1fr, min-height 760px. Left: account fields. Right: surface-tinted personalization panel.
- **Components**: Full name / email / password fields (password requirements as a plain list below it), country select. Right side: "Investment Goals" (3 radio options, `.radio`), "Risk Tolerance" (3-way `.seg` segmented control), "Preferred Industry" (tag chips, `.tag-accent` for the first 2 pre-selected, `.tag-neutral` for the rest), separated by `.hr` 2px rules, ending in a primary block CTA "Start Your Investing Journey".

### 3. Dashboard — Grid & table (option 1c)
- **Purpose**: Dense, data-forward home screen.
- **Layout**: Top nav (`.mock-nav`, 2px bottom divider) → 4-column index grid (2px bordered box, `.grid-cell` dividers between cells) → watchlist data table.
- **Components**: 4 market-index cards (name, price, change pill). `.table` with columns Symbol/Sector/Price/Change/7D-sparkline/star-icon; each row: 80×28px inline SVG sparkline, `.tag.tag-neutral` sector chip, change pill with up/down chevron icon.

### 4. Dashboard — Chart-led (option 1d)
- **Purpose**: Alternate home screen leading with a featured index chart.
- **Layout**: 2fr/1fr bordered block: left = large chart (720×220 SVG) with headline price; right = 3 stacked index rows. Below: 1.4fr/1fr row — left: top-4 watchlist mini-rows (small sparkline + name/price/change); right: an "Alerts" summary `.card`.

### 5. Stock Detail — Full-width (option 1e)
- **Purpose**: Deep dive on one stock, tabbed content below a hero chart.
- **Layout**: Header row (company name/ticker/price/change on the left, "Watchlist" + "Set alert" buttons on the right) → full-width 1416×260 SVG chart → tab row (`.mock-nav` styled as tabs: Overview/News/Financials/Peers) → 6-column key-stat grid (Open/High/Low/Volume/Mkt Cap/P-E).

### 6. Stock Detail — Split w/ sidebar (option 1f)
- **Purpose**: Same data, chart + contextual actions side by side.
- **Layout**: 2fr/1fr bordered block. Left: header, 880×240 chart, 4-column stat row. Right sidebar: "Price alert" creation `.card` (above/below `.seg`, target input, primary button), "Related" stock list (3 rows), "News" list (3 items with source + relative time).

### 7. Watchlist (option 1g)
- **Purpose**: Manage tracked symbols.
- **Layout**: Header row with search field, All/Gainers/Losers `.seg` filter, and primary "Add symbol" button, above a full `.table`.
- **Components**: Table columns Symbol/Sector/Price/Change/7D trend/Alert-bell-icon/overflow-menu icon.

### 8. Price Alerts (option 1h)
- **Purpose**: View and create price alerts.
- **Layout**: Header with primary "New alert" button, above an alerts `.table` (Symbol/Condition/Target/Status/overflow menu). A `.dialog` + `.dialog-backdrop` is shown open over the page: symbol input, Above/Below `.seg`, target-price input, Cancel/Create actions.
- **Status tag mapping**: Active → `.tag-accent`, Triggered → `.tag-outline`, Paused → `.tag-neutral`.

## Interactions & Behavior
- All screens are static mockups — no wired-up state. Implement: form validation on sign up (password rules shown as static copy), symbol search/filtering on Watchlist, alert create/cancel dialog open-close, tab switching on Stock Detail, "Add symbol" flow.
- Hover/active/focus states are defined by the Modernist stylesheet's built-in component states (buttons, inputs, segmented controls, table rows) — see `styles.css`; don't restyle these per screen.
- Change indicators: an up-chevron + accent-tinted pill for positive, a down-chevron + neutral pill for negative — reused everywhere a price change appears.

## State Management
- Auth: email/password fields, loading/error state for sign in and sign up.
- Onboarding: selected goal (single-select), risk tier (single-select), selected industries (multi-select).
- Dashboard/Watchlist/Stock Detail: live price + change data per symbol, 7-day price history (drives the sparkline/chart SVGs), active tab (stock detail), search/filter query (watchlist).
- Alerts: list of alerts (symbol, condition, target, status), new-alert dialog open/closed + form fields.

## Design Tokens
From the Modernist design system (`styles.css` in this folder):
- **Colors**: `--color-bg #f3f2f2`, `--color-surface #eae9e9`, `--color-text #201e1d`, `--color-accent #ec3013` (single-accent/mono scheme). Full 100–900 tonal ramps for neutral and accent — see `:root` in `styles.css`.
- **Type**: `--font-heading` / `--font-body` both Archivo (400/600/800 weights). Scale: h1 42px, h2 32px, h3 25px, h4 20px, h5 16px, h6 13px (uppercase, letter-spacing .08em).
- **Spacing**: `--space-1` 4px … `--space-8` 32px.
- **Radius**: 0px everywhere (`--radius-sm/md/lg` all 0) — never round a corner.
- **Shadows**: `--shadow-sm/md/lg` — ink-tinted, tuned to the light ground.
- **Dividers**: 2px rules using `--color-divider` (40% ink) between major sections; 1px for table row rules.
- **Icons**: Lucide-style inline SVGs (24×24 viewBox, 2px stroke, round caps/joins), 12–16px inline sizes.

## Assets
No photographic assets used. All icons are inline SVG (Lucide style, hand-authored to match). Charts/sparklines are computed inline SVG polylines from sample price-history arrays — replace with your real charting solution or keep as lightweight custom SVG if preferred.

## Files
- `Tonkla Redesign.dc.html` — the full design file. It's a "Design Component" (HTML + an embedded template/logic split inside `<x-dc>`/`<script data-dc-script>` tags) rendered by a small runtime — open it in a browser to view all 8 screens on one pannable canvas. Read past the `<x-dc>` wrapper for the plain HTML structure and the JS at the bottom for the sample data model (indices, watchlist rows, alerts, news, stats, tabs).
- `styles.css` — the complete Modernist design-system stylesheet (tokens + component classes: `.btn`, `.field`/`.input`, `.card`, `.tag`, `.nav`, `.table`, `.dialog`, etc.). Reference for exact values; also usable directly if the target stack can consume plain CSS custom properties.
