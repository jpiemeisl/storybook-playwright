# Commerce: account area

Phase 12 (hand-written). This covers sign-in and password forms, account navigation, order history and detail, the downloads library, subscription management, invoices, the address book and the wishlist. Everything lives in [`src/commerce`](../src/commerce), and the core library never imports it (`npm run check:boundaries`).

There is no backend, no real authentication and no sessions: the templates take data and call back.

## Data shapes

All of these are JSON-serializable. Dates are ISO 8601 and money is integer minor units.

| Type | Where | Notes |
| --- | --- | --- |
| `Customer` | [`types/account.ts`](../src/commerce/types/account.ts) | id, name, email, createdAt |
| `CustomerSubscription` (extended) | [`types/order.ts`](../src/commerce/types/order.ts) | New fields: `cancelAtPeriodEnd`, `pausedUntil` or `pauseOpenEnded`, `currentPeriodEnd`, `paymentMethodSummary` (generic text such as "Card ending 4242"), `availablePlans` (exactly one `current`) and `productId` |
| `SubscriptionPlanOption` | `types/account.ts` | id, name, price, interval, features, current |
| `Invoice` | `types/account.ts` | number, issuedAt, description, amount, status (`paid`, `open`, `failed` or `refunded`), safe `href`, optional `subscriptionId` and `orderId` |
| `SavedAddress` | `types/account.ts` | `Address` plus id, label and the default flags. A book holds at most one default per kind. |
| `WishlistItem` | `types/account.ts` | productId, addedAt |
| `LibraryItem` | `types/account.ts` | A purchased digital product with its files (the order download shape plus a `reason` when unavailable), licence, and an optional `licenseKey` |
| Page shapes | [`types/account-pages.ts`](../src/commerce/types/account-pages.ts) | `AuthPage`, plus the eight account pages. Every account page has `customer` (null when signed out) and `now`. |

**Validators:** `validateCustomer`, `validateInvoice`, `validateSavedAddress`, `validateAddressBook`, `validateWishlistItem`, `validateLibraryItem`, the extended `validateCustomerSubscription`, `validateAuthPage` and `validateAccountPage`.

The subscription validator has status-specific rules:
- a paused subscription needs `pausedUntil` or `pauseOpenEnded`
- a cancelled one needs `cancelledAt`
- `cancelAtPeriodEnd` is allowed only on active or trialing subscriptions, and needs `currentPeriodEnd`
- `paymentMethodSummary` must not contain a full card number

**Orders** gain an optional `tracking.url` (safe hrefs only; anything else shows as text) and a download `reason`.

## Wiring the templates to a host app

```tsx
import { createTemplates, PageRenderer } from 'storybook-playwright';
import { commerceTemplates } from 'storybook-playwright/commerce';

const templates = createTemplates(Object.values(commerceTemplates));
// keys: login, register, forgot-password, reset-password, account, account-orders, account-order,
// account-downloads, account-subscriptions, account-subscription, account-addresses, account-wishlist
```

### Auth: forms, actions and CSRF

`AuthPage` is `{ template, action, status, errorMessage?, email?, expired?, layout?, links? }`.

- **Without JavaScript,** each form is a real `<form method="post" action={page.action}>` with named fields:
  - sign in: `email`, `password`, `remember`
  - register: `name`, `email`, `password`, `confirmPassword`, `marketingConsent`, `termsAccepted`
  - forgot password: `email`
  - reset password: `password`, `confirmPassword`
- **CSRF and reset tokens:** put them in `ctx.formHiddenFields`, for example `<input type="hidden" name="csrf" value={token} />`. They go into every auth form. The reset token belongs there too, never in a URL the library builds.
- **With JavaScript,** `ctx.onLogin`, `onRegister`, `onForgotPassword` and `onResetPassword` receive the validated values instead of the native POST. Report back by re-rendering with `status`: `submitting`, `error` (with `errorMessage`) or `success`.
- **Client checks** (`validateLogin`, `validateRegister`, …) only check shape. The server validates again.

### Account pages and callbacks

Supply page data from your APIs, `now` from your server clock, and these callbacks in `ctx`:

| Callback | Used by |
| --- | --- |
| `onSignOut()` | AccountNav (all account pages) |
| `onSubscriptionAction(subscriptionId, request)` | Subscription detail and cards. `request` is `{ type: 'pause', months, resumesOn }`, `{ type: 'change-plan', planId, effective }`, `{ type: 'cancel', reason?, comment? }`, `resume`, `undo-cancel`, `reactivate` or `update-payment`. |
| `onRetryInvoice(invoice)` | Invoice list (failed invoices) |
| `onReorder(order)` | Order detail ("Buy again") |
| `onSaveAddress`, `onDeleteAddress`, `onSetDefaultAddress` | Address book |
| `onRemoveWishlistItem(productId)` | Wishlist |
| `downloadHref(productId, fileId)` | Downloads library (signed URLs; default `#` placeholders that don't navigate) |
| `paymentFields` | Past-due notice: your payment provider's hosted fields |

**Subscription actions and `status`:**
- A synchronous host just re-renders with new data.
- An async host sets `page.status = 'submitting'` before `onSubscriptionAction` returns, then `idle` (the dialog closes and the outcome is announced) or `error` with `errorMessage` (the dialog stays open).

## Dialog contract

`ManageSubscription`, `AddressBook` and the other components with dialogs share one rule: **a dialog closes based on `status`**, not on the click.

1. **On confirm,** the component calls your callback with the request.
2. **A synchronous host** updates its data and leaves `status` as `idle`; the dialog closes straight away and the outcome is announced.
3. **An asynchronous host** (a server round trip) must set `status: 'submitting'` *inside the callback, before it returns*. The confirm button then shows its loading state and the dialog stays open.
4. **When the save finishes,** set `status: 'idle'` (the dialog closes and the outcome is announced) or `status: 'error'` with `errorMessage` (the dialog stays open and shows the error; the customer can retry or close it).

If `submitting` is set later, for example after an `await`, the component sees `idle` first and closes the dialog before the save has finished. The address book announces changes as soon as its callbacks return and shows `errorMessage` in the open dialog; drive it the same way.

## Security notes

- **No payment fields.** "Update payment method" is a callback, and the past-due notice has a slot for your provider's hosted fields. This library renders no card inputs, the same rule as checkout. `paymentMethodSummary` is generic text, never a brand logo or a full number; the validator rejects long digit runs.
- **Non-enumerating errors.** A failed sign-in shows `GENERIC_LOGIN_ERROR` ("The email or password is incorrect…") whatever the reason. A reset request always shows "If an account exists for <email>, a reset link has been sent." Keep your own server errors equally generic.
- **Passwords.** Fields are never pre-filled (no prop accepts a password value), autocomplete tokens are correct (`username`, `current-password`, `new-password`, `email`, `name`), and the value is shown as text only while the user presses the toggle.
- **Password rules are a baseline.** 12+ characters, not only digits, a letter and a number, no leading or trailing spaces. There's no strength score and no breached-password list; the server must enforce its own rules.
- **Masked licence keys.** `LicenseKey` shows only the last four characters until the customer reveals it. The key is not in the DOM before that, never goes into an attribute, URL or log, and a test checks it's absent from the server-rendered HTML.

## Subscription action matrix

These come from `getSubscriptionStatusInfo(sub, now)` and `getSubscriptionActions(sub)`, with now = 2026-03-21T09:00:00Z and the fixtures in `fixtures/account/subscriptions.ts`. A unit test checks this table against the logic, so it can't drift.

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

The rules behind the actions:
- **pause:** active or trialing, and not cancelling.
- **resume:** paused.
- **change-plan:** active or trialing, not cancelling, with another plan to switch to.
- **cancel:** anything not already cancelled or cancelling.
- **undo-cancel:** cancelling.
- **update-payment:** any status except cancelled.
- **reactivate:** cancelled.

**Plan change timing is the host's decision.** Set `subscription.planChangeEffective` to `'immediately'` or `'next-billing-date'` (the default). Three things follow from that one field:
- **The dialog copy:** `getPlanChangeSummary(current, next, { effective, nextBillingAt })` says either "…today. Your next charge, on Apr 15, 2026, uses the new price." or "…on Apr 15, 2026. You keep Monthly until then."
- **The request:** `{ type: 'change-plan', planId, effective }` carries the same value.
- **The data:** a next-billing-date change is shown through `subscription.scheduledPlanChange` (`{ planId, effectiveAt }`), which the card renders as "Switches to Annual on Apr 15, 2026".

Neither timing prorates, so the copy always says "Nothing is charged today". Direction compares yearly cost exactly: upgrade, downgrade or switch. The demo follows the request: immediate changes switch the plan, and next-billing-date changes set `scheduledPlanChange`.

**Pause dates** clamp month ends: Jan 31 + 1 month is Feb 28, or Feb 29 in leap years.

## What the demo provider does and does not do

`DemoAccountProvider` and `useDemoAccount()` (Storybook only, in `demo/`) keep the customer, orders, subscriptions, invoices, downloads, addresses and wishlist in memory.
- **Actions:** `perform(action)` runs the pure `applyAccountAction`, which validates with `getSubscriptionActions` and dates from `DEMO_NOW`, returns a typed result (`not-allowed`, `not-found` or `server`) and shows a Toast.
- **Failures:** `parameters.demo.failAction` makes every action fail with a server error.

It does not:
- persist anything
- call a payment provider, authenticate or send email
- use timers
- prorate: plan changes apply immediately in the demo, so the new plan shows

## Fixed demo time

`DEMO_NOW` is `2026-03-21T09:00:00Z`. The trial fixture ends in 6 days (Mar 27), the active one renews Apr 1, and the paused one resumes Jun 1. The 3, 12 and 60-order histories are seeded (20260321), newest first.

## Gap report

What the library lacked and how it was filled:

- **Icons:** user, log-out, eye, eye-off, receipt, file-text, pencil. pause, play, calendar and map-pin already existed.
- **New components:**
  - forms: AuthFormShell, PasswordField, PasswordChecklist, LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm
  - navigation and orders: AccountNav, SignedOutPrompt, StatusBadge (Order and Subscription), OrderHistory, OrderTimeline, OrderItemsList, OrderTotalsSummary, OrderActions
  - downloads and subscriptions: DownloadsLibrary, LicenseKey, SubscriptionCard, ManageSubscription, InvoiceList
  - addresses and wishlist: AddressBook, WishlistGrid
- **Moved:** AddressBlock, from the checkout template into components.
- **Small additive changes:**
  - `SummaryRows` takes precomputed `rows` (`orderSummaryRows` for placed orders)
  - `DownloadList` shows per-file reasons and uses unique ids
  - `WishlistButton` gains `action="remove"`
  - orders gain `tracking.url`
- **Phase 10 fixes:** story tags spread in from shared objects were dropped; `npm run check:story-tags` now guards against that. LoadMore's progress fill also disappeared in forced colours.

### Workarounds and decisions to review

1. **ManageSubscription takes one `onAction(request)` callback,** not one per action. Seven separate callbacks would have pushed it to 12 props.
2. **Wishlist remove button.** It's named "Remove <title> from wishlist" without `aria-pressed`: a pressed toggle called "Remove" would contradict itself. It keeps the saved (filled heart) style.
3. **Status-driven dialog closing.** Dialogs close when `status` is `idle` after a request. Async hosts must set `submitting` synchronously inside the callback.
4. **"Keep subscription" takes focus first** through the native `autofocus` attribute, set from a ref callback, which `showModal()` honours.
5. **AccountNav layout follows its own container width.** It's a vertical list in the 16rem sidebar (wide pages) and a horizontally scrollable row with scroll-snap from 20rem (full width on narrow pages). Since Phase 14 the row has edge fades where more items are hidden (`scrollHint.module.css`: sticky pseudo-elements shown per edge with CSS scroll-state queries, no JavaScript). Browsers without scroll-state queries show no cue; in forced colours the fades are removed and the scrollbar remains.
6. **Year groups in invoices and order groups in downloads are not landmarks.** Headings carry the structure, so a page with many years isn't full of regions. The downloads search box is not a `search` landmark either, since it only filters the list.
7. **The OrderHistory matrix story disables `landmark-unique`.** Seven histories on one page repeat the filter and pagination navs; the template stories check the rule on a real page.
8. **Digital-only orders read "Complete"** rather than Processing, Shipped or Delivered.
9. **The password checklist is announced without timers:** a summary on blur, and once when every rule is met. The list itself is not a live region.

### Deferred

- ~~A fade or arrow hint on the scrollable account nav~~: shipped in Phase 14.
- Proration and immediate plan changes. The demo applies plan changes at once; production should schedule them.
- Address autocomplete and non-US addresses.
- Real sign-in providers: `socialSlot` renders nothing by default.
