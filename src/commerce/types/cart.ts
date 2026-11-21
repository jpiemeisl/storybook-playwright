import type { Money } from '../../content-types/money';
import type { ImageRef } from '../../content-types/shared';
import type { ProductKind, PurchaseOption } from './product';

/** What a line looked like when added, so carts and orders render without the catalogue. */
export interface CartLineSnapshot {
  /** Product title. */
  title: string;
  /** Variant title, e.g. "M / Moss". Omit for single-variant products. */
  variantTitle?: string;
  /** Line image. */
  image?: ImageRef;
  /** Variant price per unit before any subscription discount. Integer minor units, cart currency. */
  unitPrice: Money;
  /** Product kind. */
  kind: ProductKind;
  /** Needs a delivery address (physical goods). */
  requiresShipping: boolean;
}

/** One line in a cart or order. */
export interface CartLine {
  /** Unique within the cart. */
  id: string;
  /** Product id in the catalogue. */
  productId: string;
  /** Variant id within the product. */
  variantId: string;
  /** Units. Integer >= 1 (the demo cart caps it at 99). */
  quantity: number;
  /** One-time or subscription. A `subscription` product line must use a subscription option. */
  purchaseOption: PurchaseOption;
  /** Display data captured when the line was added. */
  snapshot: CartLineSnapshot;
}

/** A shopping cart. */
export interface Cart {
  /** Cart id. */
  id: string;
  /** Lines in the order they were added. */
  lines: CartLine[];
  /** Promo codes as entered (matched case-insensitively). */
  promoCodes: string[];
  /** Chosen shipping method; the first method is used as an estimate when omitted. */
  shippingMethodId?: string;
  /** ISO 4217 code; every line uses it. */
  currency: string;
}

/** A shipping method. */
export interface ShippingMethod {
  /** Unique id. */
  id: string;
  /** Name, e.g. "Standard". */
  label: string;
  /** Short explanation. */
  description?: string;
  /** Price per order. Integer minor units. */
  price: Money;
  /** Delivery estimate as text, e.g. "3-5 working days". */
  estimate?: string;
}

/** A promo code definition (demo use: real stores validate codes on a server). */
export interface PromoCode {
  /** The code, matched case-insensitively. */
  code: string;
  /** `percent` off the subtotal, `fixed` amount off, or `free-shipping`. */
  kind: 'percent' | 'fixed' | 'free-shipping';
  /** Percent 1-100 for `percent`; integer minor units (cart currency) for `fixed`; unused for `free-shipping`. */
  value?: number;
  /** Minimum merchandise subtotal in minor units before the code applies. */
  minSubtotal?: number;
  /** Shown to the customer, e.g. "10% off your first order". */
  description: string;
}
