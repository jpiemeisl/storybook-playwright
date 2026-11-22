/*
 * Account area types. JSON-serializable: dates are ISO 8601 strings, money is integer minor units.
 */
import type { Money } from '../../content-types/money';
import type { Address, Order } from './order';
import type { BillingInterval, DigitalDelivery } from './product';

/** A signed-in customer. */
export interface Customer {
  id: string;
  /** Display name, e.g. "Robin Vale". */
  name: string;
  email: string;
  /** ISO 8601 date the account was created. */
  createdAt: string;
}

/** A plan a subscription can switch to. Exactly one in a list is `current`. */
export interface SubscriptionPlanOption {
  id: string;
  /** e.g. "Quarterly". */
  name: string;
  /** Per cycle. */
  price: Money;
  interval: BillingInterval;
  /** Short lines shown on the plan card. */
  features: string[];
  current?: boolean;
}

/** An invoice for an order or a subscription charge. */
export interface Invoice {
  id: string;
  /** Customer-facing number, e.g. "INV-2026-0042". */
  number: string;
  /** ISO 8601 date. */
  issuedAt: string;
  /** e.g. "Seasonal seed box, March". */
  description: string;
  amount: Money;
  status: 'paid' | 'open' | 'failed' | 'refunded';
  /** PDF link from the host. Must be a safe href. */
  href?: string;
  /** The subscription it bills, for the subscription detail page. */
  subscriptionId?: string;
  /** The order it bills. */
  orderId?: string;
}

/** An address in the address book. */
export type SavedAddress = Address & {
  id: string;
  /** e.g. "Home", "Office". */
  label?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
};

/** A product saved to the wishlist. */
export interface WishlistItem {
  productId: string;
  /** ISO 8601 date-time. */
  addedAt: string;
}

/** One file in the downloads library: the Order download shape (with `reason` for unavailable files). */
export type LibraryFile = NonNullable<Order['downloads']>[number];

/** A purchased digital product in the downloads library. */
export interface LibraryItem {
  productId: string;
  productTitle: string;
  orderId: string;
  orderNumber: string;
  /** ISO 8601 date of the order. */
  purchasedAt: string;
  files: LibraryFile[];
  licence?: DigitalDelivery['licence'];
  /**
   * Licence key, shown masked until the customer reveals it. Never put it in a URL, attribute or log.
   */
  licenseKey?: string;
}
