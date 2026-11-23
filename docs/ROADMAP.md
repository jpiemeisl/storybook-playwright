# Roadmap

Open work, with notes for whoever picks it up. Every item here is also listed as open in
[GAPS.md](GAPS.md), which keeps the history of each gap and the resolved ones.

## Done

- **Docker image and Linux baselines (Phase 15).** Every baseline is rendered in the Playwright image
  pinned by digest in `docker/image.json`, with pinned fonts (`docker/fonts.conf`). See
  [testing.md](testing.md).
- **CI (Phase 16).** GitHub Actions runs every check, the sharded visual suite, the accessibility suite
  and the package job on every pull request and push to `main`, behind the single required `ci-status`
  check. Dependabot keeps actions and npm packages current (Playwright excluded). See [ci.md](ci.md).
- **Publishing (Phase 17).** `@jpiemeisl/pattern-library` is published privately to GitHub Packages by
  the release workflow, from version tags on `main` that passed CI, with a GitHub Release and a Storybook
  zip per version. See [publishing.md](publishing.md) and [consuming.md](consuming.md).

## Next: Umbraco adapter

Map Umbraco content (Delivery API JSON: document types, block lists, rich text, media, links) to
`PageContent` and the template page shapes, following `src/adapters/example-cms`. Sanitize rich text with
an allow-list in the adapter. Ship it as a separate package that depends on the core types
(`@jpiemeisl/pattern-library` as a peer), released the same way; set the new package to private right
after its first publish ([publishing.md](publishing.md#package-settings-once-after-the-first-publish)).

## Platform and content

- **Other CMS adapters.** `src/adapters/example-cms` shows the mapping. Further adapters for headless
  CMSs should also live in separate packages that depend on the core types.
- **Backend integration guide.** Document how a host app wires the commerce templates to a real cart,
  checkout, payment provider (hosted fields only) and account API, replacing the demo providers.
- **Horizontal overflow at 375 px.** These stories render wider than the viewport: Compositions/
  ContentPages Blog Post Layout, Templates/Blog index, Content model All Blocks and Templates/Composed
  pages Contact. Fix the components, then regenerate those baselines.
- **Forced colors by hand.** Chromium's emulation doesn't repaint author colors; check the main flows in
  a real Windows contrast theme.
- **Search result spacing.** Search reuses `Card`; a dedicated `SearchResult` component would allow
  tighter spacing.
- **Cookie banner offset for toasts.** Toasts and the cookie banner can overlap at the bottom of the
  viewport (toasts stack on top). A shared bottom-stack token would let them avoid each other.

## Commerce

- **Save for later.** `CommerceContext.onSaveForLater` is a callback slot only. It needs a saved-items
  list on the cart page and a move-back action; the demo cart reducer is the place to prototype it.
- **Address lookup and non-US addresses.** `AddressForm` and `validateUsAddress` handle the 50 states, DC
  and ZIP / ZIP+4 only. International support needs per-country field sets (labels, order, postal code
  rules), a country selector and an optional lookup provider slot (no network in the library: the host
  app passes suggestions in).
- **Real tax.** The flat demo rate (`DEMO_TAX_RATE`) is labeled "Estimated tax". A real integration
  passes tax lines in from the backend; `computeCartTotals` would take them as input rather than
  computing them.
- **Proration.** Plan changes carry `effective` timing, but no proration amounts. Show the host's
  computed credit or charge in the change-plan summary.
- **Review submission form.** `ReviewSummary` has an `action` slot for a link. A form needs rating input,
  validation, moderation messaging and spam protection on the host.
- **Price filters for other currencies.** URL price filters assume two decimals (USD). Use the
  currency's minor-unit exponent before supporting JPY or KWD.
- **Checkout without JavaScript.** Step forms are controlled; a plain-form fallback would need server
  validation per step.

## Accounts and authentication

- **Real authentication.** Auth templates post to `page.action` or call host callbacks; the demo shop
  accepts a fixed demo customer. Real sign-in, sessions, password reset tokens and rate limiting belong to
  the host app. Sign-in provider buttons go in `ctx.socialSlot`.

## Internationalization

- **Multi-currency and i18n.** All copy is English and inside components. A message catalog (props or a
  context of strings), `Intl` locale options for dates and money, and right-to-left checks (logical
  properties are already used throughout) are the main pieces.
