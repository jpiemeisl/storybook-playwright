# Gaps: open items and their history

Every gap the phases found, in one place: what was missing, what was decided and what is still open. Each
item is **Resolved** (with the phase that closed it), **Open**, **By design**, a **Limitation** or a
**Decision to review**. Every Open item is also on the [roadmap](ROADMAP.md), with notes on how to tackle
it. The guides describe the library as it is today; this file keeps the history.

## Commerce: product and browsing

- **Resolved (Phase 10):** what browsing needed was added to the library: icons (`heart`,
  `heart-filled`, `filter`, `sort`, `truck`, `refresh`, `shield`, `ruler`) and the listing, filter and
  product page components (ProductCard, ProductGrid, CollectionCard, LoadMore, SortSelect, FilterPanel,
  ActiveFilters, FilterDrawer, ProductGallery, VariantSelector, SizeGuide, PurchaseOptionSelector,
  QuantityStepper, AddToCart, WishlistButton, DeliveryInfo, ReviewSummary, RelatedProducts and more). No
  new tokens; core controls and layout are reused.
- **Resolved (Phase 14):** sticky mobile add-to-cart bar (`StickyBuyBar`).
- **By design:** a price range uses two number inputs, not a slider.
- **By design:** templates don't sync the URL; the host app does (`ctx.onSelectionChange`,
  `ctx.onListingChange`). The demo shop shows how.
- **Open:** review submission. `ReviewSummary` has an `action` slot for a link; there is no form.
- **Open:** URL price filters assume two decimals (right for USD, wrong for JPY or KWD).
- **Decision to review:** product cards keep one link (the stretched title link) plus at most one button;
  "Choose options" is an `aria-hidden` cue, and quick add is a real button.
- **Decision to review:** option chips and swatches are visually hidden native inputs inside styled
  labels; checked state is a thicker border plus a tick, never color alone, and VariantSelector puts the
  state ("sold out", "not available with the other options chosen") in each radio's `aria-label`.
- **Decision to review:** FilterDrawer renders only its button and dialog; wide containers show the same
  FilterPanel inline, so both never exist at once.
- **Decision to review:** without live mode, SortSelect is its own GET form that repeats the filters as
  hidden fields.
- **Decision to review:** AddToCart's disabled states use `aria-disabled` plus a visible reason linked
  with `aria-describedby`, not `disabled`.
- **Decision to review:** ReviewSummary's bars are decorative; the counts are text. No `<meter>`.
- **Decision to review:** ProductGallery switches between thumbnails and a keyboard-scrollable strip at a
  28rem container width.

## Commerce: cart and checkout

- **Resolved (Phase 11):** what cart and checkout needed: Toast in core (`ToastRegion`, `Toast`,
  `useToasts`), icons, order fields (`email`, `totals.dueToday`, `recurring`, download `format` and
  `sizeBytes`), helpers (`summaryRows`, `thenBilled`, `getCartNotes`, `firstInvalidStep`, `US_STATES`)
  and `data-sticky-action-bar` so toasts sit above sticky bars. No new tokens.
- **Resolved (Phase 14):** sticky mobile checkout bar, submitting the step form through the `form`
  attribute.
- **Open:** save for later. `onSaveForLater` is a callback slot only.
- **Open:** address autocomplete or verification, and non-US addresses (checkout and the address book).
- **Open:** real tax. `computeCartTotals` applies a flat demo rate labeled "Estimated tax"; it should take
  the host's tax lines instead.
- **Open:** checkout needs JavaScript; the step forms have no plain-form fallback.
- **Decision to review:** before an address is known, totals include the first shipping method's price as
  an estimate, so the rows add up to "Due today".
- **Decision to review:** free shipping applies to every method once the threshold or a code applies.
- **Decision to review:** the Review step shows the items itself and leaves out the order summary sidebar.
- **Decision to review:** OrderSummary stays open on wide screens through a media query listener; without
  JavaScript it starts closed.
- **Decision to review:** quantity steppers only on physical lines; digital and subscription lines show
  "Qty N" as text.
- **Decision to review:** busy line items use a muted background instead of reduced opacity (which failed
  text contrast).

## Commerce: account

- **Resolved (Phase 12):** what the account area needed: auth forms and fields, account navigation, order
  history and detail, downloads with masked license keys, subscription management, invoices, the address
  book and the wishlist. Story tags spread from shared objects were being dropped; `check:story-tags` now
  guards them. LoadMore's progress fill reappeared in forced colors.
- **Resolved (Phase 13):** plan-change timing (`immediately` or `next-billing-date`) is the host app's
  choice; the dialog copy, the request and the demo follow it.
- **Resolved (Phase 14):** scroll hint on the horizontally scrolling AccountNav (CSS scroll-state edge
  fades; browsers without scroll-state queries show no cue).
- **Open:** proration amounts. Neither timing prorates, and the copy says "Nothing is charged today".
- **Resolved (after Phase 17.5):** the sign-in template had no way to show provider buttons; host apps
  pass them in `ctx.socialSlot`. The provider integration itself belongs to the host app.
- **Resolved (after Phase 17.5):** the code issues found while documenting: checkout without a billing
  address (`ctx.collectBillingAddress`), real download links on order pages, status-driven AddressBook,
  a wishlist callback on the product page, a configurable account base path, hidden controls instead of
  do-nothing callbacks, Tabs manual activation, Header late items, Carousel in right-to-left layouts,
  whitespace-only form input, and more (CHANGELOG.md).
- **Open:** real authentication. The demo shop accepts a fixed demo customer.
- **Decision to review:** ManageSubscription takes one `onAction(request)` callback, not seven.
- **Decision to review:** ManageSubscription dialogs close when `status` returns to `idle`; async host apps
  must set `submitting` synchronously inside the callback.
- **Decision to review:** the wishlist remove button is named "Remove <title> from wishlist" without
  `aria-pressed`.
- **Decision to review:** "Keep subscription" takes focus first in the cancel dialog.
- **Decision to review:** AccountNav is a vertical list in the sidebar and a scroll-snap row on narrow
  pages.
- **Decision to review:** invoice year groups and download groups aren't landmarks; headings carry the
  structure.
- **Decision to review:** the OrderHistory matrix story disables `landmark-unique` (seven histories on one
  page); the template stories check the rule on a real page.
- **Decision to review:** digital-only orders read "Complete" rather than shipping states.
- **Decision to review:** the password checklist announces a summary on blur and once when every rule is
  met, without timers or a live list.

## Content and templates

- **Resolved (Phase 8):** what the templates needed was added: `AnnouncementBar`, `SiteLogo`, `LinkList`,
  `EmptyState`, `DescriptionList`, `PrevNextNav`, `SidebarLayout`, `StickyActionBar` and the
  `--sticky-action-bar-height` token.
- **Resolved (Phase 8):** component extensions: a logo-only Header (`items=[]`), SearchInput as a real GET
  form (`action`), Card and ArticleCard `size="lg"`, BlockRenderer `h1Provided`, `layout="flow"` and
  `PageSection`, and template validation (`unknown-template`, `invalid-date`, `invalid-pagination`).
- **Resolved (Phase 8):** bugs the templates exposed: grid tracks overflowing at 375 px (PageHeader and the
  nested BlockRenderer grid), long words overflowing TableOfContents, `padding: none` sections cancelling
  the next section's padding, and `scroll-padding-top` touching the sticky header border.
- **Resolved (Phase 14):** horizontal scroll hint for CategoryFilter on narrow containers.
- **Resolved (Phase 14):** the header had no place for host controls; Header `actions` and
  `ctx.headerActions` were added.
- **By design:** only Legal has template CSS of its own (print rules); SiteLayout's CSS is layout plumbing.
- **By design:** the search result trail is plain text, not `Breadcrumbs` (ten breadcrumb landmarks with
  one name would fail `landmark-unique`).
- **By design:** the error code is a `Badge` with a text label, not a large decorative number.
- **Open:** a dedicated `SearchResult` component for tighter search result spacing (results reuse `Card`).
- **Open (found in Phase 15):** horizontal overflow at 375 px in Blog Post Layout, Blog index, All Blocks
  and Contact.
- **Decision to review:** three related posts or stats wrap 2 + 1 at 768 px (the container is just under
  the grid's step); left unchanged to avoid shifting baselines.
- **Decision to review:** Legal's print-link-URL rule could become a `Prose` prop if more templates need it.

## Themes

- **Resolved (Phase 13):** components moved to new semantic tokens (`--radius-round`, `--radius-inline`,
  `--radius-control`, `--color-link`, `--color-link-hover`, `--border-width-control`,
  `--border-width-card`, `--text-font-heading`, `--letter-spacing-heading`), and `color-scheme` moved into
  each palette. No component reads a theme name; the token allowlist stayed empty.
- **Resolved (Phase 13):** contrast fixes: `--neutral-450` for the default `--color-border-strong` (2.57:1
  to 3.4:1 on white), and `--color-bg-accent-subtle` and `--color-overlay-media` on every inverse surface.
- **Limitation:** fixture images are light, so they're bright on `harbor`.
- **Limitation:** `harbor` headings use weight 800; stacks without an 800 weight fall back to bold.
- **By design:** themes use `@scope (…) to ([data-theme])`, which stops at a nested theme; browsers without
  `@scope` show the `default` theme. Phase 14's scroll hints likewise need scroll-state queries.
- **By design:** `@media not print` around each theme, so print always uses `default`.
- **By design:** `harbor`'s media scrim on inverse surfaces is light, because its inverse text is dark.
- **Open:** a manual forced-colors check in real Windows contrast themes; Chromium's emulation doesn't
  repaint author colors.
- **Decision to review:** the accessibility suite reads the axe results of Storybook's a11y addon instead
  of adding `@axe-core/playwright`, so rules and options come from the addon's configuration.
- **Decision to review:** elevation and surface tokens keep their names (`--elevation-*`,
  `--color-surface*`) to avoid churn.
- **Decision to review:** the 1% diff threshold hid the default `--color-border-strong` change; no default
  baseline was rewritten although pixels changed slightly.

## Privacy and consent

- **Resolved (Phase 14):** `CookieBanner` (UI only, not legal advice; the host app stores and applies
  consent).
- **Open:** toasts and the cookie banner can overlap at the bottom edge (toasts stack on top).

## Library and tooling

- **Resolved (Phase 14):** library build verification (`build:lib`, `check:lib`); commerce imports core as
  an external, and core exports `Checker`, `isObj`, `isNonEmptyString` and `layoutProps`.
- **Resolved (Phase 14):** one command for every non-browser check (`check:all`), and a components
  inventory that fails when stale.
- **Resolved (Phase 14):** multi-capture stories timed out under load; per-test timeouts scale with the
  number of captures.
- **Resolved (Phase 14):** an internal `<Link target="_blank">` gets `rel="noopener"` like external links.
- **Resolved (Phase 14):** four stories whose screenshots duplicated a sibling's use
  `vrt.screenshot: false` (11 fewer captures, play tests kept).
- **Resolved (Phase 15):** a Playwright Docker image pinned by digest, Linux baselines and pinned fonts.
- **Resolved (Phase 15):** dialogs (Modal, FilterDrawer, MiniCart, MobileMenu) reopened right after
  closing were shut again by the late native `close` event.
- **Resolved (Phase 16):** CI on GitHub Actions, with the single required `ci-status` check.
- **Resolved (Phase 17):** publishing and versioning: the package is released to GitHub Packages from
  version tags, with a CHANGELOG, an API report and a package contents check.
- **Resolved (Phase 17.5):** documentation organized by audience and kept accurate by `check:docs` and
  `check:jsdoc` in CI.
- **Open:** the Umbraco adapter, other CMS adapters and a backend integration guide.
- **Open:** multi-currency and i18n.
