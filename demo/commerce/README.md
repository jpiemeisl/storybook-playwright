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
