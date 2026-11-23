# Commerce: cart and checkout

This guide covers the cart, the multi-step checkout and the order confirmation. The overview is in
[commerce.md](commerce.md). Everything lives in [`src/commerce`](../src/commerce), except `Toast`, which
is generic and in the core library. The core library never imports commerce (`npm run check:boundaries`).

There is no backend and no payment handling: the templates take data and call back.

## The purchase flow

```mermaid
flowchart LR
  Cart["Cart page<br/>(cart template)"] -->|Check out| Info

  subgraph Checkout["Checkout (checkout template)"]
    Info["Information<br/>email + address"]
    Ship["Shipping<br/>method"]
    Pay["Payment<br/>method, billing, terms"]
    Review["Review<br/>Place order"]
    Info -->|"something ships<br/>(physical, mixed)"| Ship --> Pay
    Info -->|"nothing ships<br/>(digital-only, subscription-only)"| Pay
    Pay --> Review
  end

  Review -->|createOrderFromCart| Confirm["Order confirmation<br/>(order-confirmation template)"]
  Cart -. blocking stock issues .-> Cart
```

### Steps by cart kind

`getCheckoutSteps(totals.flags)` decides the steps: the shipping step exists only when a line needs shipping.

| Cart | Steps | Address on Information | Payment step extras |
| --- | --- | --- | --- |
| Physical only | Information, Shipping, Payment, Review | Shipping address | "Same as shipping address" billing checkbox |
| Digital only | Information, Payment, Review | Billing address (with a note on why) | Digital delivery note |
| Subscription only | Information, Payment, Review | Billing address (with a note on why) | Renewal and cancellation checkbox |
| Mixed, with a physical line | Information, Shipping, Payment, Review | Shipping address | Billing checkbox, plus the digital note and renewal checkbox when relevant |

A subscribe-and-save line on a physical product counts as physical: it ships. A mixed cart with no
physical line (digital plus subscription) follows the "nothing ships" path.

**Billing address model.** Every payment needs a billing address.
- If something ships, billing defaults to "same as shipping". A separate billing address is required on Payment only when that box is unticked.
- If nothing ships, there is no shipping address, so the billing address is collected on Information instead.

Hosts whose payment provider collects billing details itself set `ctx.collectBillingAddress: false`.
The checkout template then leaves out the billing address fields (on Information for carts that ship
nothing, on Payment for carts that ship) and the billing address on Review, and validates without them.
`validateCheckoutStep`, `canEnterStep` and `firstInvalidStep` take the same option as
`{ collectBillingAddress: false }`; pass it in your own step routing and server checks too.

```tsx check
import { canEnterStep, type CheckoutFlags, type CheckoutValues, type CommerceContext } from '@jpiemeisl/pattern-library/commerce';

/** The provider's hosted form collects the billing address, so checkout doesn't. */
export const checkoutContext: CommerceContext = { collectBillingAddress: false };

/** Server-side routing with the same rule. */
export const canOpenPayment = (values: CheckoutValues, flags: CheckoutFlags) => canEnterStep('payment', values, flags, { collectBillingAddress: false });
```

## CheckoutValues

It is JSON-serializable, so the host can keep it wherever it likes. The library never stores it.
`emptyCheckoutValues()` returns a fresh, empty set.

```ts
interface CheckoutValues {
  email: string;
  marketingConsent?: boolean;          // never pre-ticked
  shippingAddress?: Address;           // US only; region = 2-letter state code
  billingSameAsShipping: boolean;
  billingAddress?: Address;
  shippingMethodId?: string;
  paymentMethod?: 'card' | 'wallet';   // the type only, never card data
  termsAccepted: boolean;
  subscriptionTermsAccepted?: boolean; // required when the cart has subscription lines
}
```

`CheckoutErrors` maps field keys to messages, for example `email`, `shippingAddress.postalCode` and `termsAccepted`.
- `validateCheckoutStep(step, values, flags, options?)` returns the errors for one step, in form order. The wording comes from the shared `getFieldError` helper.
- `canEnterStep(step, values, flags, options?)` is true only when every earlier step is valid.
- `firstInvalidStep(values, flags, options?)` returns the first step with errors (and its errors), or null.

## Wiring it to a host app

Merge `commerceTemplates` into the template registry as in [commerce.md](commerce.md#wiring-it-into-a-host-app).
The cart helpers build the page data:

```tsx check
import type { SiteChrome } from '@jpiemeisl/pattern-library';
import { PageRenderer, createTemplates } from '@jpiemeisl/pattern-library';
import { commerceTemplates, computeCartTotals, getCartIssues, getCartNotes } from '@jpiemeisl/pattern-library/commerce';
import type { Cart, CartContext, CartPage, CommerceContext, Product } from '@jpiemeisl/pattern-library/commerce';

const templates = createTemplates(Object.values(commerceTemplates));

interface CartRouteProps {
  cart: Cart;
  /** The current catalog, for stock issues and line notes. */
  products: Product[];
  /** Promo definitions, shipping methods and the server's "now". */
  cartContext: CartContext;
  chrome: SiteChrome;
  ctx: CommerceContext;
}

export function CartRoute({ cart, products, cartContext, chrome, ctx }: CartRouteProps) {
  const page: CartPage = {
    id: 'cart',
    slug: 'cart',
    template: 'cart',
    seo: { title: 'Your cart' },
    blocks: [],
    cart,
    totals: computeCartTotals(cart, cartContext),
    issues: getCartIssues(cart, products),
    notes: getCartNotes(cart, products),
  };
  return <PageRenderer page={page} chrome={chrome} templates={templates} ctx={ctx} />;
}
```

### Cart (`template: 'cart'`)

The page is `{ cart, totals, issues, notes?, crossSell?, status?, lineStatus?, links? }`.
- `totals` comes from `computeCartTotals`. The template does no pricing.
- `issues` comes from `getCartIssues(cart, currentCatalog)`. Blocking issues disable Check out with a visible reason, and the alert links to each affected line.
- `status: 'loading'` shows a skeleton and `'error'` a page-level alert; `lineStatus` marks lines the host is saving (`updating` or `error`).

The callbacks go in `ctx`:
- `onQuantityChange`, `onRemoveLine`
- `onApplyPromo` (return `{ ok, message }`, or a promise of it). The promo code form appears only when this is set. It is a real POST form (field `promo`, to the current URL), so it also submits without JavaScript.
- `onRemovePromo`, `onCheckout` (without it, Check out is a link to `links.checkout`)
- `onSaveForLater`: a callback slot only; the library doesn't implement saving for later
- `lineHref`, plus `productHref` and `onQuickAdd` for the "Complete your order" products

### Checkout (`template: 'checkout'`)

The page is `{ cart, totals, step, values, errors?, shippingMethods, issues?, notes?, status?, errorMessage?, links? }`. Wire it like this:
- `ctx.onCheckoutChange(values)`: store the values. When `shippingMethodId` changes, recompute totals with that method.
- `ctx.onStepChange(step)`: route to the step, for example `/checkout/payment`. The template validates the current step before calling it, and the stepper calls it to go back to completed steps that `canEnterStep` allows. Never route forward past a step that `canEnterStep` rejects. Without `onStepChange`, steps are `?step=…` links.
- `ctx.collectBillingAddress`: `false` to leave out the billing address (see the billing address model above).
- `ctx.onPlaceOrder()`:
  1. Run `firstInvalidStep` again on the server.
  2. Confirm the payment with your provider.
  3. Create the order through your order API.
  4. Set `status: 'submitting'` while waiting, and `status: 'error'` with an `errorMessage` on failure.
  5. On success, route to the confirmation.
- `ctx.paymentFields`: your payment provider's hosted fields. See the security rule below.
- `page.errors`: errors from the host (for example a server check), shown until the next Continue.
- An empty cart or blocking issues render a guard that links back to the cart.

The template uses the core `SiteLayout` `minimal` variant (logo-only header and legal footer). The step
forms are controlled, so checkout needs JavaScript. The order summary is collapsed above the form on
narrow screens, beside it from 64rem, and left out on Review, which lists the items itself.

### Payment fields: security rule

**This library never renders card number, expiry or CVC inputs.** `PaymentMethodSelector` only records
the type (`card` or `wallet`) and renders `ctx.paymentFields` (or its `paymentFields` prop) under the
selected method. Production host apps must put the provider's hosted fields (iframes) in that slot, so
card data never touches this code.

`DemoPaymentFields` is a static panel with no inputs: "Payment fields from your payment provider appear
here. Demo only: no payment is taken." A story checks that the selector contains no text inputs.

### Confirmation (`template: 'order-confirmation'`)

The page is `{ order, links? }`. Build the order with `createOrderFromCart(cart, values, { orderId, orderNumber, placedAt, promoDefinitions, shippingMethods, products })`.
The caller supplies the ids and the time: the function never reads the clock or generates ids, and it
doesn't validate the values (run `firstInvalidStep` first).
- Digital lines become `downloads`, each with the `productId` it belongs to.
- Subscription lines become `recurring` (first billing date, trial end, a ready-made note).
- Shippable carts get the shipping address and method.
- When trials make today's charge smaller, `totals.dueToday` is set.

Download links on the confirmation come from `ctx.downloadHref(productId, fileId)`, the same callback as
the account downloads library. Without it they're `href="#"` placeholders that never navigate. The "Demo
only: a confirmation would be emailed to …" line is shown only when `order.email` exists. Nothing is sent.

### Validation

These check page data before rendering:
- `validateCartPage(page, cartContext)`: totals equal `computeCartTotals`, issues point at real lines, links are safe.
- `validateCheckoutPage(page, cartContext)`: as above, plus the step exists for this cart and the chosen shipping method is offered.
- `validateConfirmationPage(page)`: everything `validateOrder` checks (including `email`, `totals.dueToday` and `recurring`), plus safe links.

## Sticky checkout bar

Below 48rem, while the step's real submit button is out of view, `StickyBuyBar` shows "Due today" and the
step's primary button. That button is `type="submit"` with the `form` attribute pointing at the step
form, so submitting runs the same validation and handler: there is no second code path, and the real
button stays the form's default (Enter in a field) because it comes first in the document. The bar
follows the same rules as the product page bar (see
[commerce-browsing.md](commerce-browsing.md#sticky-add-to-cart-bar)): hidden where IntersectionObserver
is unsupported, scroll padding while shown, safe-area inset, below toasts and the cookie banner, not
printed. It is absent while the cart is empty or blocked.

## Toast (core)

- `ToastRegion` goes once per page. Normal toasts go in a polite `role="status"` container and `urgent` toasts in a `role="alert"` one. Both containers always exist, so additions are announced. Nothing takes focus.
- Auto-dismiss is off unless `duration` is set. When set, it pauses on hover and while focus is inside, restarts in full afterwards, and never runs while the page is hidden. No story enables it.
- Up to 3 toasts show (`maxVisible`). Older ones collapse behind "+N more"; urgent toasts always show.
- **Keeping focused content visible:** while toasts are shown, an effect measures how far the stack reaches up the viewport and sets `--toast-stack-size` on `<html>`. The stylesheet turns that into `scroll-padding-block-end`, so focusing or scrolling to an element stops above the stack rather than under it.
- **Placement:** the stack sits above any element with `data-sticky-action-bar` (`StickyActionBar` and `StickyBuyBar` set it). Host apps can add `--toast-offset-block-end` for other bars.
- `useToasts()` keeps toasts in memory, through the pure, tested `toastReducer`.

## What the demo provider does and does not do

`DemoCommerceProvider` (Storybook only, in [`demo/commerce`](../demo/commerce/README.md)) adds two hooks
next to `useDemoCart()`:
- `useDemoCheckout()` keeps values, step, errors and status in memory. `placeOrder()` validates every step, then calls `createOrderFromCart` with deterministic ids (`ord-2026-2101`, `FH-2101`, …; `placedAt` = `DEMO_NOW`) and stores the result as `lastOrder`. A failure happens only when the story sets `parameters.demo.failPlaceOrder`.
- `useDemoToasts()` turns cart actions (added, removed, promo applied or rejected) into toasts. It uses no timers.

The demo does not:
- persist anything
- call a payment provider
- reserve stock
- calculate real tax: it uses a flat 8% estimate (`DEMO_TAX_RATE`)
- send email
- show a real "submitting" delay: the Submitting story sets the status directly

## Deterministic fixture values

| Value | Fixture |
| --- | --- |
| Order ids and numbers | `orderContext(n)` → `ord-2026-<n>`, `FH-<n>`. Confirmation fixtures use 2001–2006; demo orders start at 2101. |
| Time | `DEMO_NOW` = `2026-03-21T09:00:00Z`. Trials and renewals count from it (for example, a 14-day trial ends Apr 4, 2026). |
| Free-shipping boundary | `carts.freeShippingBelow` ($74.99) and `carts.freeShippingAt` ($75.00); the threshold is `FREE_SHIPPING_THRESHOLD`. |

## Limitations

- **Checkout requires JavaScript.** The step forms are controlled and have no plain-form fallback. Only the cart's promo code form submits natively.
- **Free shipping applies to every method** once the $75 threshold (or a free-shipping code) is met, because `computeCartTotals` zeroes shipping for whichever method is chosen. `ShippingMethodSelector` marks every method as free to match (`freeMethodIds`).
- **Estimated shipping before an address.** The cart summary shows "Estimated shipping" with the first method's price and "Calculated at checkout from your address", so the rows still add up to "Due today".
- **US addresses only.** Fifty states plus DC, ZIP or ZIP+4. No address autocomplete or verification.
- **Tax is a labeled 8% demo estimate** ("Estimated tax"). Real tax needs the address and a tax service.
- **Save for later** is a callback slot only.
