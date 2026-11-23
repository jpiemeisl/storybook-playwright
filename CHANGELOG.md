# Changelog

All notable changes to `@jpiemeisl/pattern-library` are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the package uses
[semantic versioning](https://semver.org/). Before 1.0.0, a minor version (0.x.0) may contain breaking
changes and a patch version (0.x.y) never does; see [docs/versioning.md](https://github.com/jpiemeisl/storybook-playwright/blob/main/docs/versioning.md) for what
counts as public API.

Add notes under "Unreleased" in the pull request that makes the change, in the sections Added, Changed,
Deprecated, Removed, Fixed and Security. `npm run release:prepare` moves them under the new version.

## [Unreleased]

### Added

- `CommerceContext.collectBillingAddress`: set it to `false` and the checkout template hides the billing
  address fields and validates without them (for payment providers that collect billing details).
- `CommerceContext.onWishlistToggle(product, saved)` and `ProductPage.inWishlist`: the product page's
  wishlist button reports changes to the host app and can be controlled by it.
- `CommerceContext.socialSlot`: sign-in provider buttons for the sign-in template.
- `AccountLinks.account`: the account area's base path (default `/account`); account templates build their
  navigation, order, subscription, breadcrumb and sign-in links under it.
- `AccountAddressesPage.status` and `AddressBook` `status`: host apps report a change's outcome, so a
  failed save keeps the dialog open with the error instead of being announced as saved.
- `Order.downloads[].productId` (set by `createOrderFromCart`), `OrderItemsList` `downloadHref`, and an
  `id` prop on `RelatedProducts` and `CrossSell`.
- `SizeGuideTable`, the size guide table type for `Product.sizeGuide`.
- `neutralizeUnsafeUrls` and `normalizePath`, US-spelled names for `neutraliseUnsafeUrls` and
  `normalisePath` (same behavior).
- A typed `clampLevel` overload for a non-empty tuple of levels.

### Changed

- `ctx.downloadHref` also links the download buttons on the order detail page and the order
  confirmation (they were always `#` placeholders).
- Controls whose callback is missing are hidden instead of doing nothing: "Add address", "Edit",
  "Delete" and "Make default" in the address book, wishlist remove buttons, and the subscription "Manage"
  actions. `AddressBook` `onSave`, `onDelete` and `onSetDefault` and `WishlistGrid` `onRemove` are now
  optional.
- US spelling and neutral copy in visible text: "License key", "Canceled" and "Canceling" status labels,
  "Your order has been received and is being prepared.", "Order <number> has been received.", the
  confirmation next steps, and "Card details are entered securely with the payment provider." Status
  values such as `'cancelled'` are unchanged.
- The free-shipping line on the product page is shown only when the product's currency matches
  `FREE_SHIPPING_THRESHOLD`.
- `validatePage` checks a page with no `template` as the `default` template, so it also warns when no
  `hero` or `pageHeader` block provides the h1.
- The `default` theme description says "grays".
- `CookieBanner`: the settings dialog's "Reject all" now calls `onRejectAll`, like the banner's, instead
  of `onSave` with every optional category off. Host apps that handled that case in `onSave` should
  handle it in `onRejectAll` (`allConsentChoices(categories, false)` builds the same value).

### Fixed

- Tabs with `activation="manual"`: arrow keys move focus and the tab stop without selecting, and leaving
  the tab list resets the tab stop to the selected tab.
- Header: navigation items that arrive after the first render are measured, so a nav that doesn't fit
  collapses to the menu button.
- Carousel: the ends, the current dot and Previous/Next work in right-to-left layouts (the arrow icons
  mirror there), and Previous from the end of the track moves back one slide.
- SearchInput: a `ref` passed by the host app reaches the input without breaking the clear button's focus
  return.
- ContactForm: a required field containing only spaces shows the required error, and minimum and maximum
  lengths are checked against the trimmed text that is submitted.
- Gallery: a thumbnail button whose image has an empty `alt` is named "Open image n of total".
- Lists no longer produce duplicate React keys when items repeat a heading, name, label, term, link or
  social platform.
- `removeFilter` removes option values that contain `=`.
- The price facet range uses per-cycle prices for subscription products, matching the price filter.
- `RelatedProducts` and `CrossSell` no longer share a fixed id, so two on one page don't duplicate it.
- `BillingIntervalSelector`'s group is named by its visible "Billing" legend.
- `WishlistButton`: the visible label stays "Save" when pressed (the filled heart shows the state), so the
  visible text is always part of its accessible name.
- `SubscriptionCard` leaves out the date line when a cancellation at period end has no end date.
- `addHeadingIds` and `extractHeadings` no longer mistake `id=` text inside another attribute's value
  for the heading's id.
- JSDoc: `PageContent.template` (resolved by the templates registry), `getProductAvailability` (the best
  status any variant has) and the blog post share URL (use an absolute URL).

### Deprecated

- `neutraliseUnsafeUrls` (use `neutralizeUnsafeUrls`), `normalisePath` (use `normalizePath`), the
  commerce `TableData` type (use `SizeGuideTable`; it clashed with the core `TableData`), and calling
  `clampLevel` with a plain array (pass a non-empty tuple). Each is kept for at least one minor version.

## [0.1.1] - 2026-11-22

Documentation and type documentation only: no change to components, styles, tokens or behavior.

### Fixed

- `docs/consuming.md`: importing the token files one by one instead of `tokens.css` needs each file
  imported into its cascade layer (`@import url(...) layer(tokens)`); the individual files carry no
  `@layer` of their own. The guide now shows the correct imports, lists the `tokens/*` export, and every
  TypeScript example in it typechecks against the package.
- README and CHANGELOG corrections (the mini cart is a component, not a template).

### Changed

- Every public export has a JSDoc summary, and non-obvious props have descriptions, so editors and
  Storybook's autodocs explain them (the shipped `.d.ts` files carry the comments).
- README rewritten as a short overview; the full documentation, grouped by audience, is in the
  [docs index](https://github.com/jpiemeisl/storybook-playwright/blob/main/docs/README.md).

## [0.1.0] - 2026-11-22

The first published version.

### Added

- Core entry point (`@jpiemeisl/pattern-library`): React 19 components for content sites. It covers
  primitives, layout, navigation, content sections, forms, media, and the site chrome (header, footer,
  announcement bar, skip link, cookie banner).
- Content model: typed blocks and pages, the block registry and `BlockRenderer`, and page templates with
  `PageRenderer`, `createTemplates` and `defineTemplate`. Also `validatePage` and `getDocumentMeta`, and
  link-safety rules for every link that comes from content.
- `LinkProvider`, which routes internal links through the host's router (Next.js, React Router or any
  anchor component).
- Commerce entry point (`@jpiemeisl/pattern-library/commerce`), imported separately from core:
  - Product listing, product detail, cart, checkout and order confirmation templates, and the mini cart.
  - Account and authentication templates.
  - Pure logic for cart totals, checkout steps, filters and validation.
  - Payment input stays in the host's slot: the library renders no card fields.
- Design tokens in three tiers (primitives, semantic, component) with cascade layers (`reset`, `tokens`,
  `base`, `components`, `overrides`).
- The `default`, `harbor` and `orchard` themes, applied with `data-theme` or the `Theme` component.
- CSS entry points: `tokens.css`, `core.css`, `commerce.css` and one file per theme.
- TypeScript declarations for every entry point.

[Unreleased]: https://github.com/jpiemeisl/storybook-playwright/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/jpiemeisl/storybook-playwright/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/jpiemeisl/storybook-playwright/releases/tag/v0.1.0
