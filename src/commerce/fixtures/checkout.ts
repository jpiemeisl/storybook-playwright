/*
 * Checkout fixtures: US addresses, checkout values per cart kind and per invalid step, the
 * deterministic order context and orders for the confirmation page. All JSON round-trip.
 *
 * Deterministic order context (orderContext(n)):
 *   orderId     "ord-2026-<n>"     e.g. ord-2026-2001
 *   orderNumber "FH-<n>"            e.g. FH-2001
 *   placedAt    DEMO_NOW            2026-03-21T09:00:00Z (trial and renewal dates count from here)
 */
import { createOrderFromCart, emptyCheckoutValues, type OrderContext } from '../logic/checkout';
import type { Cart, ShippingMethod } from '../types/cart';
import type { CheckoutValues } from '../types/checkout';
import type { Address, Order } from '../types/order';
import { carts, type CartFixtureKey } from './carts';
import { products } from './products';
import { DEMO_NOW, promoDefinitions, shippingMethods } from './store';

export { US_STATES } from '../logic/usStates';

/** US addresses for checkout forms. */
export const checkoutAddresses = {
  home: { name: 'Robin Vale', line1: '14 Alder Row', city: 'Portland', region: 'OR', postalCode: '97201', country: 'US', phone: '503 555 0142' },
  apartment: { name: 'Sam Okafor', line1: '2210 Larkin Street', line2: 'Apt 5C', city: 'San Francisco', region: 'CA', postalCode: '94109', country: 'US' },
  zipPlus4: { name: 'Jordan Reyes', company: 'Reyes & Daughters Landscaping', line1: '901 Commerce Drive', city: 'Austin', region: 'TX', postalCode: '78701-2345', country: 'US', phone: '(512) 555-0199' },
  longNames: {
    name: 'Maximiliana Alexandrina Featherstonehaugh-Montgomery-Worthington',
    company: 'The Extraordinarily Long Company Name Horticultural Supply Cooperative, Incorporated',
    line1: '123456 North Saint Christopher Columbus Memorial Parkway Extension',
    line2: 'Building 14, Floor 27, Suite 2700-B, Attention Receiving Department',
    city: 'Rancho Santa Margarita',
    region: 'CA',
    postalCode: '92688-1234',
    country: 'US',
    phone: '+1 (949) 555-0123',
  },
} satisfies Record<string, Address>;

/** No shipping methods available (e.g. an address the store cannot ship to). */
export const shippingMethodsNone: ShippingMethod[] = [];

const base = (extra: Partial<CheckoutValues>): CheckoutValues => ({ ...emptyCheckoutValues(), email: 'robin@example.com', ...extra });

/** Valid, complete values for each cart kind, plus the empty and per-step invalid cases. */
export const checkoutValues = {
  empty: emptyCheckoutValues(),
  physical: base({ shippingAddress: checkoutAddresses.home, shippingMethodId: 'ship-standard', paymentMethod: 'card', termsAccepted: true }),
  /** Nothing ships: the billing address is collected on the information step. */
  digital: base({ billingAddress: checkoutAddresses.apartment, paymentMethod: 'card', termsAccepted: true }),
  subscription: base({ billingAddress: checkoutAddresses.home, paymentMethod: 'wallet', termsAccepted: true, subscriptionTermsAccepted: true }),
  mixed: base({
    shippingAddress: checkoutAddresses.home,
    billingSameAsShipping: false,
    billingAddress: checkoutAddresses.zipPlus4,
    shippingMethodId: 'ship-express',
    paymentMethod: 'card',
    termsAccepted: true,
    subscriptionTermsAccepted: true,
    marketingConsent: true,
  }),
  longNames: base({ email: 'maximiliana.featherstonehaugh-montgomery@extraordinarily-long-domain-name.example', shippingAddress: checkoutAddresses.longNames, shippingMethodId: 'ship-standard', paymentMethod: 'card', termsAccepted: true, subscriptionTermsAccepted: true }),
  /** Information step: bad email, missing street and city, bad ZIP. */
  invalidInformation: base({ email: 'robin@', shippingAddress: { name: 'Robin Vale', line1: '', city: '', region: 'OR', postalCode: '9720', country: 'US' } }),
  /** Shipping step: no method chosen. */
  invalidShipping: base({ shippingAddress: checkoutAddresses.home }),
  /** Payment step: no method, terms not accepted, billing different but empty. */
  invalidPayment: base({ shippingAddress: checkoutAddresses.home, shippingMethodId: 'ship-standard', billingSameAsShipping: false }),
  /** Digital-only information step: no billing address. */
  invalidDigitalBilling: base({}),
} satisfies Record<string, CheckoutValues>;

/** Valid values for a cart fixture, by its kind. */
export function checkoutValuesForCart(key: CartFixtureKey): CheckoutValues {
  const cart = carts[key];
  const ships = cart.lines.some((l) => l.snapshot.requiresShipping);
  const subscribes = cart.lines.some((l) => l.purchaseOption.type === 'subscription');
  if (ships) return { ...checkoutValues.physical, ...(subscribes ? { subscriptionTermsAccepted: true } : {}) };
  return subscribes ? checkoutValues.subscription : checkoutValues.digital;
}

/** Deterministic ids and time for createOrderFromCart (see the file header). */
export function orderContext(n: number, placedAt = DEMO_NOW): OrderContext {
  return { orderId: `ord-2026-${n}`, orderNumber: `FH-${n}`, placedAt, promoDefinitions, shippingMethods, products };
}

const confirmed = (n: number, cart: Cart, values: CheckoutValues): Order => createOrderFromCart(cart, values, orderContext(n));

const withoutEmail = ({ email: _email, ...order }: Order): Order => order;

/** Orders for the confirmation page, made by createOrderFromCart (so they always match their carts). */
export const confirmationOrders = {
  physical: confirmed(2001, carts.physicalOnly, checkoutValues.physical),
  digital: confirmed(2002, carts.digitalOnly, checkoutValues.digital),
  subscriptionTrial: confirmed(2003, carts.subscriptionWithTrial, checkoutValues.subscription),
  mixed: confirmed(2004, carts.mixed, { ...checkoutValues.mixed, shippingMethodId: 'ship-standard' }),
  longNames: confirmed(2005, carts.longTitles, checkoutValues.longNames),
  /** No email supplied: the confirmation leaves out the "would be emailed" line. */
  noEmail: withoutEmail(confirmed(2006, carts.oneLine, checkoutValues.physical)),
} satisfies Record<string, Order>;
