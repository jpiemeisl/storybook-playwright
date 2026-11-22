# Roadmap

What is still open after Phase 14, with notes for whoever picks it up. Resolved items and the history
of each gap are in [GAPS.md](GAPS.md).

## Commerce

- **Save for later.** `CommerceContext.onSaveForLater` is a callback slot only. Needs a saved-items list
  on the cart page and a move-back action; the demo cart reducer is the place to prototype it.
- **Address lookup and non-US addresses.** `AddressForm` and `validateUsAddress` handle the 50 states,
  DC and ZIP / ZIP+4 only. International support needs per-country field sets (labels, order, postal
  code rules), a country selector and an optional lookup provider slot (no network in the library: the
  host passes suggestions in).
- **Real tax.** The 8% demo estimate is labelled "Estimated tax". A real integration passes tax lines in
  from the backend; `computeCartTotals` would take them as input rather than computing them.
- **Proration.** Plan changes carry `effective` timing, but no proration amounts. Show the host's
  computed credit or charge in the change-plan summary.
- **Review submission form.** `ReviewSummary` has an `action` slot for a link. A form needs rating
  input, validation, moderation messaging and spam protection on the host.
- **Price filters for other currencies.** URL price filters assume two decimals (USD). Use the
  currency's minor-unit exponent before supporting JPY or KWD.
- **Checkout without JavaScript.** Step forms are controlled; a plain-form fallback would need server
  validation per step.

## Accounts and authentication

- **Real authentication.** Auth templates post to `page.action` or call host callbacks; the demo shop
  accepts a fixed demo customer. Real sign-in, sessions, password reset tokens and rate limiting belong
  to the host.
- **Sign-in providers.** `socialSlot` renders nothing by default; add provider buttons there.

## Internationalisation

- **Multi-currency and i18n.** All copy is English and inside components. A message catalogue (props or
  a context of strings), `Intl` locale options for dates and money, and right-to-left checks (logical
  properties are already used throughout) are the main pieces.

## Platform and process

- **Docker image and Linux baselines: done (Phase 15).** Every baseline is rendered in the Playwright
  image pinned by digest in `docker/image.json`, with pinned fonts (`docker/fonts.conf`).
- **CI (next).** Run `npm run check:all`, then the visual and accessibility suites in the same pinned
  image (the image from `docker/image.json` as the job container, `npm ci`, `npm run test:vrt` and
  `npm run test:a11y` with `PW_DOCKER=1`), on pull requests and main.
- **Horizontal overflow at 375 px (found in Phase 15).** These stories render wider than the viewport, on
  every platform: Compositions/ContentPages Blog Post Layout, Templates/Blog index, Content model
  All Blocks and Templates/Composed pages Contact. Fix the components, then regenerate those baselines.
- **Publishing and versioning.** `npm run build:lib` and `check:lib` verify the package shape, but it is
  `private` and unpublished. Next: a real package name, semver with a changelog, and a release workflow.
- **Real CMS adapters.** `src/adapters/example-cms` shows the mapping. Real adapters (headless CMSs)
  should live in separate packages that depend on the core types.
- **Backend integration guide.** Document how a host wires the commerce templates to a real cart,
  checkout, payment provider (hosted fields only) and account API, replacing the demo providers.
- **Forced colours by hand.** Chromium emulation doesn't repaint author colours; check the main flows in
  a real Windows contrast theme.
- **`@scope` support.** Themes need CSS `@scope`; browsers without it show the default theme.

## Deferred in Phase 14

- **Search result spacing.** Search reuses `Card`; a dedicated `SearchResult` component would allow
  tighter spacing.
- **Cookie banner offset for toasts.** Toasts and the cookie banner can overlap at the bottom of the
  viewport (toasts stack on top). A shared bottom-stack token would let them avoid each other.
