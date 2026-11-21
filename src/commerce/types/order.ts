import type { Money } from '../../content-types/money';
import type { BillingInterval } from './product';
import type { CartLine, ShippingMethod } from './cart';

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
  tracking?: { carrier: string; number: string; events: { at: string; label: string }[] };
  /** Download links for digital lines. */
  downloads?: { fileId: string; name: string; available: boolean; expiresAt?: string }[];
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
}
