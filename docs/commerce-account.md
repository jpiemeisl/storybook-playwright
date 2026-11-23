# Commerce: account area

This guide covers sign-in and password forms, account navigation, order history and detail, the
downloads library, subscription management, invoices, the address book and the wishlist. The overview is
in [commerce.md](commerce.md). Everything lives in [`src/commerce`](../src/commerce), and the core library
never imports it (`npm run check:boundaries`).

There is no backend, no real authentication and no sessions: the templates take data and call back.

## Data shapes

All of these are JSON-serializable. Dates are ISO 8601 and money is integer minor units.

| Type | Where | Notes |
| --- | --- | --- |
| `Customer` | [`types/account.ts`](../src/commerce/types/account.ts) | id, name, email, createdAt |
| `CustomerSubscription` | [`types/order.ts`](../src/commerce/types/order.ts) | Besides plan, price, interval, status and dates: `cancelAtPeriodEnd`, `pausedUntil` or `pauseOpenEnded`, `currentPeriodEnd`, `paymentMethodSummary` (generic text such as "Card ending 4242"), `availablePlans` (exactly one `current`), `planChangeEffective`, `scheduledPlanChange` and `productId` |
| `SubscriptionPlanOption` | `types/account.ts` | id, name, price, interval, features, current |
| `Invoice` | `types/account.ts` | number, issuedAt, description, amount, status (`paid`, `open`, `failed` or `refunded`), safe `href`, optional `subscriptionId` and `orderId` |
| `SavedAddress` | `types/account.ts` | `Address` plus id, label and the default flags. A book holds at most one default per kind. |
| `WishlistItem` | `types/account.ts` | productId, addedAt |
| `LibraryItem` | `types/account.ts` | A purchased digital product with its files (the order download shape, with a `reason` when unavailable), `licence` terms, and an optional `licenseKey` |
| Page shapes | [`types/account-pages.ts`](../src/commerce/types/account-pages.ts) | `AuthPage`, plus the eight account pages. Every account page has `customer` (null when signed out) and `now`. |

**Validators:** `validateCustomer`, `validateInvoice`, `validateSavedAddress`, `validateAddressBook`,
`validateWishlistItem`, `validateLibraryItem`, `validateCustomerSubscription`, `validateAuthPage` and
`validateAccountPage`.

The subscription validator has status-specific rules:
- a paused subscription needs `pausedUntil` or `pauseOpenEnded`, and only paused ones may have them
- a canceled one (`cancelled`) needs `cancelledAt`, and only canceled ones may have it
- `cancelAtPeriodEnd` is allowed only on active or trialing subscriptions, and needs `currentPeriodEnd`
- `paymentMethodSummary` must not contain a full card number (8 or more digits in a row)
- `scheduledPlanChange.planId` must be one of `availablePlans` and not the current plan

**Orders** have an optional `tracking.url` (safe hrefs only; anything else shows as text) and a
per-download `reason`.

## Wiring the templates to a host app

Merge `commerceTemplates` into the template registry as in [commerce.md](commerce.md#wiring-it-into-a-host-app).
The account and auth template keys are `login`, `register`, `forgot-password`, `reset-password`,
`account`, `account-orders`, `account-order`, `account-downloads`, `account-subscriptions`,
`account-subscription`, `account-addresses` and `account-wishlist`.

### Auth: forms, actions and CSRF

`AuthPage` is `{ template, action?, status?, errorMessage?, email?, expired?, layout?, links? }`. The
template uses the `minimal` site layout unless `layout` is `default`.

- **Without JavaScript,** each form is a real `<form method="post" action={page.action}>` with named fields:
  - sign in: `email`, `password`, `remember`
  - register: `name`, `email`, `password`, `confirmPassword`, `marketingConsent`, `termsAccepted`
  - forgot password: `email`
  - reset password: `password`, `confirmPassword`
- **CSRF and reset tokens:** put them in `ctx.formHiddenFields`, for example `<input type="hidden" name="csrf" value={csrfToken} />`. They go into every auth form. The reset token belongs there too, never in a URL the library builds.
- **With JavaScript,** `ctx.onLogin`, `onRegister`, `onForgotPassword` and `onResetPassword` receive the validated values instead of the native POST. Report back by re-rendering with `status`: `submitting`, `error` (with `errorMessage`) or `success`.
- **Client checks** (`validateLogin`, `validateRegister`, `validateForgotPassword`, `validateResetPassword`) only check shape. The server validates again.

```tsx check
import type { ReactNode } from 'react';
import type { CommerceContext, LoginValues } from '@jpiemeisl/pattern-library/commerce';

/** Auth callbacks for the context. `csrfToken` comes from your server session. */
export function authContext(csrfToken: string, signIn: (values: LoginValues) => void): CommerceContext {
  const hidden: ReactNode = <input type="hidden" name="csrf" value={csrfToken} />;
  return { formHiddenFields: hidden, onLogin: signIn };
}
```

### Account pages and callbacks

Supply page data from your APIs, `now` from your server clock, and these callbacks in `ctx`:

| Callback | Used by |
| --- | --- |
| `onSignOut()` | AccountNav (all account pages) |
| `onSubscriptionAction(subscriptionId, request)` | Subscription detail (every action) and the subscription cards on the list page (`update-payment` only). `request` is `{ type: 'pause', months, resumesOn }`, `{ type: 'change-plan', planId, effective }`, `{ type: 'cancel', reason?, comment? }`, or `{ type }` for `resume`, `undo-cancel`, `reactivate` and `update-payment`. |
| `onRetryInvoice(invoice)` | Invoice list (failed invoices) |
| `onReorder(order)` | Order detail ("Buy again") |
| `onSaveAddress`, `onDeleteAddress`, `onSetDefaultAddress` | Address book |
| `onRemoveWishlistItem(productId)` | Wishlist |
| `onQuickAdd`, `productHref` | Wishlist cards |
| `downloadHref(productId, fileId)` | Downloads library (signed URLs; default `#` placeholders that don't navigate). Download links on the order detail page are always placeholders. |
| `paymentFields` | Past-due notice on the subscription detail: your payment provider's hosted fields |

## Dialog contract

`ManageSubscription` (the actions on the subscription detail page) closes its dialogs **based on
`status`**, not on the click:

1. **On confirm,** the component calls `onSubscriptionAction` with the request.
2. **A synchronous host** updates its data and leaves `status` as `idle`; the dialog closes straight away and the outcome is announced.
3. **An asynchronous host** (a server round trip) must set `page.status: 'submitting'` *inside the callback, before it returns*. The confirm button then shows its loading state and the dialog stays open.
4. **When the save finishes,** set `status: 'idle'` (the dialog closes and the outcome is announced) or `status: 'error'` with `errorMessage` (the dialog stays open and shows the error; the customer can retry or close it).

If `submitting` is set later, for example after an `await`, the component sees `idle` first and closes
the dialog before the save has finished.

`AddressBook` works differently: it has no `status`. Its dialogs close and the change is announced as
soon as the callback returns. `page.errorMessage` on the addresses page is shown inside the edit dialog
the next time it is open.

## Security notes

- **No payment fields.** "Update payment method" is a callback, and the past-due notice has a slot for your provider's hosted fields. This library renders no card inputs, the same rule as checkout. `paymentMethodSummary` is generic text, never a brand logo or a full number; the validator rejects long digit runs.
- **Non-enumerating errors.** A failed sign-in shows `GENERIC_LOGIN_ERROR` ("The email or password is incorrect…") whatever the reason. A reset request always shows "If an account exists for <email>, a reset link has been sent." Keep your own server errors equally generic.
- **Passwords.** Fields are never pre-filled (no prop accepts a password value), autocomplete tokens are correct (`username`, `current-password`, `new-password`, `email`, `name`), and the value is shown as text only while the "Show password" toggle is on.
- **Password rules are a baseline.** 12+ characters, not only digits, a letter and a number, no leading or trailing spaces (`getPasswordChecks`). There's no strength score and no breached-password list; the server must enforce its own rules.
- **Masked license keys.** `LicenseKey` shows only the last four characters until the customer reveals it. The key is not in the DOM before that, never goes into an attribute, URL or log, and a test checks it's absent from the server-rendered HTML.

## Subscription action matrix

These come from `getSubscriptionStatusInfo(sub, now)` and `getSubscriptionActions(sub)`, with now = 2026-03-21T09:00:00Z and the fixtures in `src/commerce/fixtures/account/subscriptions.ts`. A unit test checks this table against the logic, so it can't drift.

<!-- action-matrix:start -->
| Fixture | Label | Status text | Actions |
| --- | --- | --- | --- |
| active | Active | Renews on Apr 1, 2026 | pause, cancel, update-payment |
| withPlans | Active | Renews on Apr 15, 2026 | pause, change-plan, cancel, update-payment |
| trialing | Free trial | Trial ends in 6 days | pause, cancel, update-payment |
| pastDue | Payment failed | Payment failed: update your payment method | cancel, update-payment |
| paused | Paused | Paused until Jun 1, 2026 | resume, cancel, update-payment |
| pausedOpenEnded | Paused | Paused until you resume it | resume, cancel, update-payment |
| cancelling | Cancelling | Cancels on Apr 2, 2026 | undo-cancel, update-payment |
| cancelled | Cancelled | Cancelled on Feb 28, 2026 | reactivate |
<!-- action-matrix:end -->

The rules behind the actions ("canceling" means `cancelAtPeriodEnd` is set):
- **pause:** active or trialing, and not canceling.
- **resume:** paused.
- **change-plan:** active or trialing, not canceling, with another plan to switch to.
- **cancel:** anything not already canceled or canceling.
- **undo-cancel:** canceling.
- **update-payment:** any status except `cancelled`.
- **reactivate:** `cancelled`.

**Plan change timing is the host's decision.** Set `subscription.planChangeEffective` to `'immediately'` or `'next-billing-date'` (the default). Three things follow from that one field:
- **The dialog copy:** `getPlanChangeSummary(current, next, { effective, nextBillingAt })` says either "…today. Your next charge, on Apr 15, 2026, uses the new price." or "…on Apr 15, 2026. You keep Monthly until then."
- **The request:** `{ type: 'change-plan', planId, effective }` carries the same value.
- **The data:** a next-billing-date change is shown through `subscription.scheduledPlanChange` (`{ planId, effectiveAt }`), which the card renders as "Switches to Annual on Apr 15, 2026".

Neither timing prorates, so the copy always says "Nothing is charged today". Direction compares yearly cost exactly: upgrade, downgrade or switch.

**Pause dates** (`computePauseResumeDate`) clamp month ends: Jan 31 + 1 month is Feb 28, or Feb 29 in leap years. Pauses are 1, 2 or 3 months.

## What the demo provider does and does not do

`DemoAccountProvider` and `useDemoAccount()` (Storybook only, in [`demo/commerce`](../demo/commerce/README.md)) keep the customer, orders, subscriptions, invoices, downloads, addresses and wishlist in memory.
- **Actions:** `perform(action)` runs the pure `applyAccountAction`, which checks subscription actions with `getSubscriptionActions`, dates changes from `DEMO_NOW`, returns a typed result (success, or `not-allowed`, `not-found` or `server`) and shows a Toast.
- **Plan changes** follow the request: immediate changes switch the plan, and next-billing-date changes set `scheduledPlanChange`.
- **Failures:** `parameters.demo.failAction` makes subscription, address and wishlist actions fail with a server error.

It does not:
- persist anything
- call a payment provider, authenticate or send email
- use timers
- prorate

## Fixed demo time

`DEMO_NOW` is `2026-03-21T09:00:00Z`. The trial fixture ends in 6 days (Mar 27), the active one renews
Apr 1, and the paused one resumes Jun 1. The 12- and 60-order histories are generated from a fixed seed
(20260321); all histories are newest first.

## Limitations

- **US addresses only,** with no autocomplete or verification (the address book uses the checkout address form).
- **No real sign-in providers.** `LoginForm` has a `socialSlot`, but the auth template doesn't fill it.
- **No proration.** Plan changes never charge or credit the difference.
