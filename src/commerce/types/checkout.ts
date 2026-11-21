/*
 * Checkout data. JSON-serializable: the host can keep it in a URL, session storage or a server
 * draft. The library never stores it.
 */
import type { Address } from './order';

/** Checkout steps in order. `shipping` exists only when the cart has shippable lines. */
export type CheckoutStepId = 'information' | 'shipping' | 'payment' | 'review';

/** What the customer has entered so far. */
export interface CheckoutValues {
  /** Contact email for the receipt. */
  email: string;
  /** Opted in to marketing email. Never pre-ticked. */
  marketingConsent?: boolean;
  /** Required when the cart needs shipping (US addresses only; `region` is the 2-letter state code). */
  shippingAddress?: Address;
  /** Use the shipping address for billing. Only meaningful when there is a shipping address. */
  billingSameAsShipping: boolean;
  /**
   * Required for payment. Collected on the information step when nothing ships (digital-only and
   * subscription-only carts), and on the payment step when it differs from the shipping address.
   */
  billingAddress?: Address;
  /** Chosen ShippingMethod id. Required when the cart needs shipping. */
  shippingMethodId?: string;
  /** Payment method type. The card or wallet details themselves live with the payment provider, never here. */
  paymentMethod?: 'card' | 'wallet';
  /** Accepted the terms of sale. */
  termsAccepted: boolean;
  /** Acknowledged renewal and cancellation terms. Required when the cart has subscription lines. */
  subscriptionTermsAccepted?: boolean;
}

/**
 * Field key → message. Keys are CheckoutValues keys, with dotted paths for address fields, e.g.
 * "email", "shippingAddress.postalCode", "billingAddress.region", "termsAccepted".
 */
export type CheckoutErrors = Partial<Record<string, string>>;
