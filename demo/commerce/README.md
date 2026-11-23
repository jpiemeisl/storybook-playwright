# Demo commerce providers (Storybook only)

**Demo only. Never ship this as production cart, checkout or account logic.**

This folder holds in-memory cart, checkout and account providers for the commerce stories and the
[demo shop](../shop/README.md). It is not part of the library: nothing under `src/` may import it, and no
barrel re-exports it (`npm run check:boundaries` enforces both).

It keeps state in memory only. It uses no localStorage, no cookies, no network and no timers, and it uses
a fixed `now` (`DEMO_NOW`), so screenshots never depend on the real clock. Real carts belong on a server,
which validates promo codes, stock and prices.

## Cart

- `reducer.ts`: a pure reducer for cart actions (add, remove, quantity, purchase option, promo codes,
  shipping method, clear, replace). Unit tested in `reducer.test.ts`.
- `DemoCommerceProvider.tsx`: React context plus `useReducer`, and the `useDemoCart()` hook. Totals come
  from `computeCartTotals` in `src/commerce`: the provider has no pricing logic of its own.
- `withDemoCommerce.tsx`: a Storybook decorator. Use `withDemoCommerce('mixed')` to preselect a fixture
  cart; a story can override it with `parameters.demoCommerce.cart`.

## Checkout and toasts

`DemoCommerceProvider` also provides:

- `useDemoCheckout()`: in-memory checkout values, step, errors and status (the pure reducer is
  `checkoutReducer.ts`). `placeOrder()` validates every step, then builds the order with
  `createOrderFromCart` and deterministic ids (`FH-2101`, ...) and stores it as `lastOrder`. Story
  parameters: `demoCommerce: { cart, checkout }` (`checkout` is a `checkoutValues` fixture key) and
  `demo: { failPlaceOrder: true }` to make placing the order fail. No timers, no randomness.
- `useDemoToasts()`: toasts for cart actions (added, removed, promo applied or rejected). Render them with
  `<ToastRegion toasts={toasts} onDismiss={dismiss} />`.

## Account

- `DemoAccountProvider` and `useDemoAccount()` keep the customer, orders, subscriptions, invoices,
  downloads, addresses and wishlist in memory.
- `perform(action)` runs the pure `applyAccountAction` (`accountReducer.ts`), which validates
  subscription actions with `getSubscriptionActions` and dates them from `DEMO_NOW`. It returns a typed
  result and shows a Toast.
- Plan changes follow the request's timing: `immediately` switches the plan, `next-billing-date` sets
  `scheduledPlanChange`. Nothing is prorated.
- In `Account.stories.tsx`, the story parameters are `demoAccount: { data }` (an `accountData` fixture key)
  and `demo: { failAction: true }`, which makes subscription, address and wishlist actions fail with a
  server error.
