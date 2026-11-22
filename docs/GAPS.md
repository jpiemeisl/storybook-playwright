# Open items and gap reports

One list of everything earlier phases deferred or left open, gathered from the gap reports in
[templates.md](templates.md), [commerce-browsing.md](commerce-browsing.md),
[commerce-checkout.md](commerce-checkout.md), [commerce-account.md](commerce-account.md) and
[theming.md](theming.md). Each item is **open** or **resolved** (with the phase that resolved it).
"In scope for Phase 14" marks the items that phase's brief covers.

## Commerce: product and browsing

- **Open (in scope for Phase 14):** sticky mobile add-to-cart bar (Phase 10).
- **Open:** review submission form. `ReviewSummary` has an `action` slot only (Phase 10).
- **Open:** price range slider. Two number inputs are used instead, as asked (Phase 10).
- **Open:** URL price filters use whole currency units and assume two decimals; revisit before JPY or KWD (Phase 10).
- **By design:** templates don't sync the URL; the host does (Phase 10).

## Commerce: cart and checkout

- **Open (in scope for Phase 14):** sticky mobile checkout bar (Phase 11).
- **Open:** save for later. A callback slot only (Phase 11).
- **Open:** address autocomplete or verification, and non-US addresses (Phases 11 and 12).
- **Open:** real tax. The flat 8% demo estimate is labelled "Estimated tax" (Phase 11).
- **Open:** checkout needs JavaScript; the step forms have no plain-form fallback (Phase 11).
- **Decision to review:** free shipping applies to every method once the threshold is met (Phase 11).

## Commerce: account

- **Open (in scope for Phase 14):** fade or arrow hint on the horizontally scrolling AccountNav (Phase 12).
- **Open:** proration. Plan-change timing landed in Phase 13 (`effective`); proration is still not modelled (Phase 12).
- **Open:** real sign-in providers. `socialSlot` renders nothing by default (Phase 12).
- **Open:** real authentication (Phase 12).

## Content and templates

- **Open (in scope for Phase 14):** horizontal scroll hint for CategoryFilter on narrow containers (same need as AccountNav).
- **Open:** a dedicated `SearchResult` component for tighter search result spacing (Phase 8).
- **Decision to review:** three related posts or stats wrap 2 + 1 at 768 px; left to avoid shifting baselines (Phase 8).
- **Decision to review:** Legal's print-link-URL rule could become a `Prose` prop if more templates need it (Phase 8).

## Themes

- **Limitation:** fixture images are light, so they're bright on harbor (Phase 13).
- **Limitation:** browsers without CSS `@scope` show the default theme (Phase 13).
- **Open:** a manual forced-colours check in real Windows contrast themes; Chromium emulation doesn't repaint author colours (Phase 13).
- **Decision to review:** the 1% diff threshold hid the default border-strong change (Phase 13).

## Tooling and process

- **Open:** CI with a fixed Playwright Docker image and Linux baselines (baselines are Windows-only, platform-less names).
- **Open:** publishing and versioning the package.
- **Open:** real CMS adapters and a backend integration guide.
- **Open:** multi-currency and i18n.
