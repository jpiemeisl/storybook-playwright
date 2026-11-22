import type { Money } from '../../content-types/money';
import type { BillingInterval } from './product';
import type { CartLine, ShippingMethod } from './cart';
import type { SubscriptionPlanOption } from './account';

/** A postal address. */
export interface Address {
  /** Recipient name. */
  name: string;
  /** Company name. */
  company?: string;
  /** Street address. */
  line1: string;
  /** Apartment, suite, etc. */
  line2?: string;
  /** City or town. */
  city: string;
  /** State, province or region. */
  region?: string;
  /** Postal or ZIP code. */
  postalCode: string;
  /** ISO 3166-1 alpha-2 country code, e.g. "US". */
  country: string;
  /** Phone number. */
  phone?: string;
}

/** Order lifecycle state. */
export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

/** Order money summary. All in the order currency, integer minor units. total = subtotal - discount + shipping + tax. */
export interface OrderTotals {
  /** Lines at their charged unit price × quantity. */
  subtotal: Money;
  /** Promo discounts, >= 0. */
  discount: Money;
  /** Shipping charged. */
  shipping: Money;
  /** Tax charged. */
  tax: Money;
  /** Amount charged. */
  total: Money;
  /**
   * Charged when the order was placed, when it differs from `total` (free-trial lines are charged
   * later). Omitted means `total` was charged.
   */
  dueToday?: Money;
}

/** A subscription line's billing after the order: first charge date, trial and amount per cycle. */
export interface OrderRecurringLine {
  /** The order line it belongs to. */
  lineId: string;
  /** Per cycle for the whole line (unit price × quantity). */
  amount: Money;
  interval: BillingInterval;
  /** ISO date of the first recurring charge (trial end, or one interval after the order). */
  firstBillingAt: string;
  /** ISO date the free trial ends. */
  trialEndsAt?: string;
  /** Ready-made text, e.g. "Free until Apr 4, 2026, then $6.00 / month" or "Next charge $18.00 on Apr 21, 2026". */
  note: string;
}

/** A placed order. */
export interface Order {
  /** Order id. */
  id: string;
  /** Customer-facing order number, e.g. "BW-10421". */
  number: string;
  /** ISO 8601 date-time. */
  placedAt: string;
  /** Status. */
  status: OrderStatus;
  /** Lines with their snapshots. */
  lines: CartLine[];
  /** Totals. */
  totals: OrderTotals;
  /** Required when any line requires shipping. */
  shippingAddress?: Address;
  /** Billing address. */
  billingAddress?: Address;
  /** Shipping method used. */
  shippingMethod?: ShippingMethod;
  /** Carrier tracking. */
  tracking?: { carrier: string; number: string; events: { at: string; label: string }[]; /** Carrier tracking page. Must be a safe href. */ url?: string };
  /**
   * Download links for digital lines. `format` and `sizeBytes` are shown when present; `reason` explains
   * why an unavailable file cannot be downloaded (from data, e.g. an expired link).
   */
  downloads?: { fileId: string; name: string; available: boolean; expiresAt?: string; format?: string; sizeBytes?: number; reason?: string }[];
  /** Billing for subscription lines. */
  recurring?: OrderRecurringLine[];
  /** Contact email given at checkout. */
  email?: string;
}

/** A customer's subscription. */
export interface CustomerSubscription {
  /** Subscription id. */
  id: string;
  /** Product title at sign-up. */
  productTitle: string;
  /** Plan name, e.g. "Quarterly". */
  plan: string;
  /** Price per cycle. */
  price: Money;
  /** Billing interval. */
  interval: BillingInterval;
  /** Status. */
  status: 'trialing' | 'active' | 'past-due' | 'paused' | 'cancelled';
  /** ISO 8601 date. */
  startedAt: string;
  /** ISO 8601 date of the next charge (not for cancelled). */
  nextBillingAt?: string;
  /** ISO 8601 date the trial ends (trialing). */
  trialEndsAt?: string;
  /** ISO 8601 date it was cancelled. */
  cancelledAt?: string;
  /** Product id in the catalogue, for links and images. */
  productId?: string;
  /** Set to cancel when the current period ends (status stays active or trialing until then). */
  cancelAtPeriodEnd?: boolean;
  /** ISO 8601 date a paused subscription resumes. Paused subscriptions need this or `pauseOpenEnded`. */
  pausedUntil?: string;
  /** Paused with no resume date (resumes only when the customer resumes it). */
  pauseOpenEnded?: boolean;
  /** ISO 8601 date the current period ends (when a cancellation takes effect). */
  currentPeriodEnd?: string;
  /** Generic text such as "Card ending 4242". Never a brand logo or a full card number. */
  paymentMethodSummary?: string;
  /** Plans the customer can switch to; exactly one is `current`. */
  availablePlans?: SubscriptionPlanOption[];
}
