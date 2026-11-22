# Gaps: open items and their history

One list of everything earlier phases deferred or left open, gathered from the gap reports in
[templates.md](templates.md), [commerce-browsing.md](commerce-browsing.md),
[commerce-checkout.md](commerce-checkout.md), [commerce-account.md](commerce-account.md) and
[theming.md](theming.md), plus what Phase 14 found. Each item is **resolved** (with the phase) or
**open**. Notes on how to tackle the open ones are in [ROADMAP.md](ROADMAP.md).

## Commerce: product and browsing

- **Resolved (Phase 14):** sticky mobile add-to-cart bar (`StickyBuyBar`), deferred in Phase 10.
- **Open:** review submission form. `ReviewSummary` has an `action` slot only (Phase 10).
- **Open (by request):** price range slider. Two number inputs are used instead (Phase 10).
- **Open:** URL price filters use whole currency units and assume two decimals; revisit before JPY or KWD (Phase 10).
- **By design:** templates don't sync the URL; the host does. The demo shop shows how (Phase 10, 14).

## Commerce: cart and checkout

- **Resolved (Phase 14):** sticky mobile checkout bar, submitting the step form through the `form` attribute (Phase 11).
- **Open:** save for later. A callback slot only (Phase 11).
- **Open:** address autocomplete or verification, and non-US addresses (Phases 11 and 12).
- **Open:** real tax. The flat 8% demo estimate is labelled "Estimated tax" (Phase 11).
- **Open:** checkout needs JavaScript; the step forms have no plain-form fallback (Phase 11).
- **Decision to review:** free shipping applies to every method once the threshold is met (Phase 11).

## Commerce: account

- **Resolved (Phase 14):** scroll hint on the horizontally scrolling AccountNav (Phase 12).
- **Resolved (Phase 13):** plan-change timing (`effective`). **Open:** proration amounts (Phase 12).
- **Open:** real sign-in providers. `socialSlot` renders nothing by default (Phase 12).
- **Open:** real authentication. The demo shop accepts a fixed demo customer (Phases 12 and 14).

## Content and templates

- **Resolved (Phase 14):** horizontal scroll hint for CategoryFilter on narrow containers.
- **Resolved (Phase 14):** the site header had no place for host controls; `Header actions` and `ctx.headerActions` added for the demo shop's search, account and cart.
- **Open:** a dedicated `SearchResult` component for tighter search result spacing (Phase 8).
- **Decision to review:** three related posts or stats wrap 2 + 1 at 768 px; left to avoid shifting baselines (Phase 8).
- **Decision to review:** Legal's print-link-URL rule could become a `Prose` prop if more templates need it (Phase 8).

## Themes

- **Limitation:** fixture images are light, so they're bright on harbor (Phase 13).
- **Limitation:** browsers without CSS `@scope` show the default theme (Phase 13). Phase 14's scroll hints likewise need CSS scroll-state queries; without them there is no cue.
- **Open:** a manual forced-colours check in real Windows contrast themes; Chromium emulation doesn't repaint author colours (Phase 13).
- **Decision to review:** the 1% diff threshold hid the default border-strong change (Phase 13).

## Privacy and consent

- **Resolved (Phase 14):** `CookieBanner` (UI only, not legal advice; the host stores and applies consent).
- **Open:** toasts and the cookie banner can overlap at the bottom edge (toasts stack on top). A shared bottom-stack offset would let them avoid each other (Phase 14).

## Library and tooling

- **Resolved (Phase 14):** library build verification (`build:lib`, `check:lib`); commerce imports core as an external. Core now exports `Checker`, `isObj`, `isNonEmptyString` and `layoutProps`, which commerce used internally.
- **Resolved (Phase 14):** one command for every non-browser check (`check:all`), and a components inventory that fails when stale.
- **Resolved (Phase 14):** heavy multi-capture stories timed out under load; per-test timeouts now scale with the number of captures. Three consecutive full runs had zero diffs.
- **Resolved (Phase 14):** an internal `<Link target="_blank">` now gets `rel="noopener"` like external links.
- **Resolved (Phase 14):** four stories whose screenshots were byte-identical to a sibling at every width (Gallery Without Lightbox, Tabs Keyboard Automatic and Keyboard Manual, Accordion Keyboard) now use `vrt.screenshot: false`: 11 fewer captures, play tests kept.
- **Resolved (Phase 15):** a fixed Playwright Docker image (pinned by digest) and Linux baselines, with pinned fonts. **Open:** running it in CI.
- **Open (found in Phase 15):** horizontal overflow at 375 px in Blog Post Layout, Blog index, All Blocks and Contact.
- **Open:** publishing and versioning the package.
- **Open:** real CMS adapters and a backend integration guide.
- **Open:** multi-currency and i18n.
