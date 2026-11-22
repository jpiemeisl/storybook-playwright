# Demo shop (Storybook only, never shipped)

A complete, navigable shop assembled only from library pieces, to show the styling and prove the pieces
fit. It lives in `demo/`: nothing under `src/` imports it and no bundle contains it
(`check:boundaries`, `check:lib`).

## Pieces

- **`router.tsx`:** an in-memory router. The current path and query live in React state; no dependency,
  no `window.location`, no history API, no storage. `matchRoute` maps paths to routes (unit tested).
- **`ShopLinkProvider.tsx`:** supplies the library's `<Link>` element through `LinkProvider`. A primary
  click on an internal href navigates in memory, then focus moves to `<main>` (tabIndex -1) and the page
  scrolls to the top. External links, modified clicks (ctrl, meta, shift, alt), `target` links and
  downloads are left alone. Anchors outside `<Link>` (CMS rich text) get the same rule. GET forms with an
  internal action (search, filters without live mode) become a route change with their fields as the
  query; any other unhandled form is stopped so the Storybook iframe never navigates.
- **`DemoShopApp.tsx`:** composes the router, `DemoCommerceProvider`, `DemoAccountProvider`, the link
  provider, a demo banner ("Demo shop: no real orders or payments"), one notifications region and the
  route pages. Routes render with `PageRenderer` and the core template registry merged with
  `commerceTemplates`.
- **Routes:** `CommerceRoutes.tsx` (collection with filter, sort and page in the query through
  `parseFilters`/`serializeFilters`, product, cart, checkout with the step in demo state, confirmation),
  `AccountRoutes.tsx` (sign in, register, forgot password, every account page) and the content routes in
  `DemoShopApp.tsx` (home, about, pricing, contact, journal, search, 404). Content is CMS-shaped data in
  `content.ts` and `journal.ts`.
- **Header controls** (`ShopHeaderActions.tsx`) use the library's `headerActions` slot: search, the
  account link ("Sign in" or the customer's first name) and the cart button with its live count, which
  opens the MiniCart. Below 30rem only the cart and the menu fit; search and the account link stay in
  the footer's Help column.

## Behaviour

- **Sign in** accepts the demo customer's email (`robin@example.com`, shown on the sign-in page's banner)
  with any non-empty password. Any other email fails with the generic error. Register signs in at once.
  There is no real authentication.
- **Placing an order** records it in the demo account (`recordOrder`): it appears in order history, its
  digital files in Downloads and its subscriptions (trials included) in Subscriptions. The cart empties.
- **Theme:** the Storybook theme toolbar wraps every story in `<Theme>`, so the whole shop restyles.
- **Cookie banner:** only in the `WithCookieBanner` story (in-memory choice; the shop sets no cookies).

## Stories

- `Demo shop/Checkpoints`: `Home` (start here; also `theme-smoke`) and routes with fixture data for
  visual tests (collection filtered, product with variants, cart mixed, each checkout step,
  confirmation, dashboard, cookie banner over the checkout bar).
- `Demo shop/Journeys`: play-function tests using roles and accessible names only. Physical purchase,
  digital purchase (no shipping step, downloads on the confirmation and in the account), trial
  subscription (due today $0, renewal text, then pause, resume and cancel at period end in the account),
  promo code, cart issue blocking checkout, search with and without results, sign-in failure and success.
- `Demo shop/Keyboard`: keyboard-only walkthroughs (skip link, MiniCart open and close, a physical
  checkout from product to confirmation), asserting where focus lands after each step.

Journey and keyboard stories use `parameters.vrt.screenshot: false`: `npm run test:vrt` runs their play
functions and axe, but never captures them. (`skip-vrt` would remove them from the suite entirely.)
