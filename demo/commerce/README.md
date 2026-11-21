# Demo only. Never ship this as production cart logic.

This folder is a **Storybook-only** demo cart for the commerce stories. It is not part of the
library: nothing under `src/` may import it, and no barrel re-exports it
(`npm run check:boundaries` enforces both).

- `reducer.ts`: a pure reducer for cart actions (add, remove, quantity, purchase option, promo codes,
  shipping method, clear, replace). Unit tested in `reducer.test.ts`.
- `DemoCommerceProvider.tsx`: React context plus `useReducer`, and the `useDemoCart()` hook. Totals come
  from `computeCartTotals` in `src/commerce`: the provider has no pricing logic of its own.
- `withDemoCommerce.tsx`: a Storybook decorator. Use `withDemoCommerce('mixed')` or set
  `parameters.demoCommerce.cart` to preselect a fixture cart.

It keeps state in memory only. It uses no localStorage, no cookies, no network and no timers, and it
uses a fixed `now` (`DEMO_NOW`), so screenshots never depend on the real clock. Real carts belong on
a server, which validates promo codes, stock and prices.

## Checkout and toasts (Phase 11)

- `useDemoCheckout()`: in-memory checkout values, step, errors and status. `placeOrder()` validates every
  step, then builds the order with `createOrderFromCart` and deterministic ids (`FH-2101`, ...) and stores
  it as `lastOrder`. Story parameters: `demoCommerce: { cart, checkout }` (a `checkoutValues` key) and
  `demo: { failPlaceOrder: true }` to make placing the order fail. No timers, no randomness.
- `useDemoToasts()`: toasts for cart actions (added, removed, promo applied or rejected). Render them with
  `<ToastRegion toasts={toasts} onDismiss={dismiss} />`.

## Account (Phase 12)

DEMO ONLY: never ship this as account logic.

- `DemoAccountProvider` and `useDemoAccount()` keep the customer, orders, subscriptions, invoices,
  downloads, addresses and wishlist in memory.
- `perform(action)` runs the pure `applyAccountAction`, which validates subscription actions with
  `getSubscriptionActions` and dates them from `DEMO_NOW`. It returns a typed result and shows a Toast.
- Story parameters: `demoAccount: { data }` (an `accountData` key) and `demo: { failAction: true }`
  to simulate server errors.
- No storage, network or timers. Plan changes apply immediately, with no proration.
