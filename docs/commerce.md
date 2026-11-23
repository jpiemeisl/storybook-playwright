# Commerce

The commerce entry point (`@jpiemeisl/pattern-library/commerce`, source in `src/commerce`) adds
product browsing, cart, checkout and a customer account on top of core. It is presentational: the host
app owns the catalog, cart state, payments, authentication and every request, and passes data and
callbacks in. This page is the overview; the three guides have the details.

| Guide | Covers |
| --- | --- |
| [commerce-browsing.md](commerce-browsing.md) | Collection listing, filters and facets in the URL, sorting, pagination, the product page, variant selection |
| [commerce-checkout.md](commerce-checkout.md) | Cart, cart issues, the checkout steps per cart kind, step validation, order confirmation, the payment slot |
| [commerce-account.md](commerce-account.md) | Sign in and registration forms, account pages, orders, downloads, subscriptions, addresses, wishlist |

## What's in it

- **Types** (`src/commerce/types`): products, variants, stock, purchase options, carts and cart lines,
  orders, subscriptions, shipping methods, promo codes, reviews, addresses and the page shapes for each
  template. All JSON, with money as integer minor units plus a currency (`Money`).
- **Pure logic** (`src/commerce/logic`, unit-tested): money arithmetic (BigInt percentages, rounded half
  away from zero, throws on a currency mismatch), cart totals (`computeCartTotals`: promos, shipping, a
  demo tax estimate, due today and recurring charges), browse logic (filters, URL format, facets, sort,
  pagination), checkout steps and validation, subscription rules, and page validators that reuse the core
  `ValidationIssue` shape. Nothing reads the clock: functions that need the time take `now`.
- **Components and templates:** listing, product, cart, checkout and account components, plus the
  templates in `commerceTemplates`: `collection`, `product-detail`, `cart`, `checkout`,
  `order-confirmation`, `login`, `register`, `forgot-password`, `reset-password`, `account`,
  `account-orders`, `account-order`, `account-downloads`, `account-subscriptions`,
  `account-subscription`, `account-addresses` and `account-wishlist`. The full export list is in
  [api-surface.md](api-surface.md#commerce-jpiemeislpattern-librarycommerce).

## Wiring it into a host app

Merge the commerce templates into the core template registry once, and pass a `CommerceContext` as
`ctx`:

```tsx check
import { PageRenderer, createTemplates, type PageContent, type SiteChrome } from '@jpiemeisl/pattern-library';
import { commerceTemplates, type CommerceContext } from '@jpiemeisl/pattern-library/commerce';

const templates = createTemplates(Object.values(commerceTemplates));

export function ShopPage({ page, chrome, ctx }: { page: PageContent; chrome: SiteChrome; ctx: CommerceContext }) {
  return <PageRenderer page={page} chrome={chrome} templates={templates} ctx={ctx} />;
}
```

Every `CommerceContext` field is optional; the guides list what each callback enables in its area. Installing the package and the CSS
imports are in [consuming.md](consuming.md).

## Rules

- **Payment fields go only in the slot.** The library never renders card number, expiry or CVC inputs.
  `PaymentMethodSelector` has a `paymentFields` slot (`ctx.paymentFields` in the checkout template); put
  the payment provider's hosted fields there. The account area has the same rule.
- **Boundaries:** only `src/commerce` and `demo/` may import from `src/commerce`, and nothing under
  `src/` may import `demo/`. `npm run check:boundaries` enforces both, and `npm run check:lib` checks
  that the built core bundle contains no commerce code.
- **Demo providers are demo only.** The in-memory cart, checkout and account providers in
  [`demo/commerce`](../demo/commerce/README.md) and the clickable [demo shop](../demo/shop/README.md)
  exist for Storybook. They never ship and aren't production logic.
