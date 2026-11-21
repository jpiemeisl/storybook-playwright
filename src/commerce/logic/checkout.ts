/*
 * Checkout steps, per-step validation and order creation. Pure: no clock, no random ids. Messages
 * come from the shared getFieldError helper (the same wording as native-constraint forms).
 *
 * Billing address model: every payment needs a billing address (most providers check it).
 *   - Carts that ship: the shipping address is collected on "information"; billing is "same as
 *     shipping" by default, and a separate billing address is required on "payment" only when unticked.
 *   - Carts that ship nothing (digital-only, subscription-only): there is no shipping address, so the
 *     billing address is collected on "information" instead, and the shipping step is skipped.
 *   Hosts whose provider collects billing details itself pass { collectBillingAddress: false }.
 */
import { getFieldError, type ValidationMessages } from '../../utils/validation';
import type { Cart } from '../types/cart';
import type { CheckoutErrors, CheckoutStepId, CheckoutValues } from '../types/checkout';
import type { Address, Order, OrderRecurringLine } from '../types/order';
import type { Product } from '../types/product';
import { computeCartTotals, type CartContext, type CartFlags, type CartTotals } from './cart';
import { multiply } from './money';
import { addDays, addInterval, formatCommerceDate, formatRecurring, subscriptionUnitPrice } from './pricing';
import { EMAIL } from './validate';
import { usStateName, US_ZIP } from './usStates';

/** The cart facts checkout depends on (CartTotals.flags satisfies it). */
export type CheckoutFlags = Pick<CartFlags, 'needsShippingStep' | 'hasSubscription' | 'hasDigital'>;

export interface CheckoutOptions {
  /** Collect a billing address for payment. Default true (see the billing address model above). */
  collectBillingAddress?: boolean;
}

export const checkoutStepLabels: Record<CheckoutStepId, string> = {
  information: 'Information',
  shipping: 'Shipping',
  payment: 'Payment',
  review: 'Review',
};

/** Ordered steps: information, shipping (only when something ships), payment, review. */
export function getCheckoutSteps(flags: Pick<CartFlags, 'needsShippingStep'>): CheckoutStepId[] {
  return flags.needsShippingStep ? ['information', 'shipping', 'payment', 'review'] : ['information', 'payment', 'review'];
}

/** Empty values: nothing ticked, billing same as shipping. */
export const emptyCheckoutValues = (): CheckoutValues => ({ email: '', billingSameAsShipping: true, termsAccepted: false });

export const addressLabels = {
  name: 'Full name',
  company: 'Company',
  line1: 'Address',
  line2: 'Apartment, suite, etc.',
  city: 'City',
  region: 'State',
  postalCode: 'ZIP code',
  phone: 'Phone',
} as const;

const addressMessages: Partial<Record<keyof typeof addressLabels, ValidationMessages>> = {
  name: { valueMissing: 'Enter a full name' },
  line1: { valueMissing: 'Enter a street address' },
  city: { valueMissing: 'Enter a city' },
  region: { valueMissing: 'Choose a state', badInput: 'Choose a state from the list' },
  postalCode: { valueMissing: 'Enter a ZIP code', patternMismatch: 'Enter a ZIP code like 97201 or 97201-1234' },
  phone: { patternMismatch: 'Enter a phone number, like 503 555 0142' },
};

const PHONE = /^\+?[\d\s().-]{7,20}$/;

const message = (field: keyof typeof addressLabels, flag: 'valueMissing' | 'patternMismatch' | 'badInput') =>
  getFieldError({ [flag]: true }, { label: addressLabels[field] }, addressMessages[field])!;

/** Errors for a US address under `prefix` ("shippingAddress" or "billingAddress"). */
export function validateUsAddress(address: Partial<Address> | undefined, prefix: 'shippingAddress' | 'billingAddress'): CheckoutErrors {
  const errors: CheckoutErrors = {};
  const value = (key: keyof Address) => (address?.[key] ?? '').trim();
  for (const field of ['name', 'line1', 'city'] as const) if (!value(field)) errors[`${prefix}.${field}`] = message(field, 'valueMissing');
  if (!value('region')) errors[`${prefix}.region`] = message('region', 'valueMissing');
  else if (!usStateName(value('region'))) errors[`${prefix}.region`] = message('region', 'badInput');
  if (!value('postalCode')) errors[`${prefix}.postalCode`] = message('postalCode', 'valueMissing');
  else if (!US_ZIP.test(value('postalCode'))) errors[`${prefix}.postalCode`] = message('postalCode', 'patternMismatch');
  if (value('phone') && !PHONE.test(value('phone'))) errors[`${prefix}.phone`] = message('phone', 'patternMismatch');
  return errors;
}

/** Which address is used for billing, if any. */
export function billingAddressFor(values: CheckoutValues, flags: Pick<CartFlags, 'needsShippingStep'>): Address | undefined {
  return flags.needsShippingStep && values.billingSameAsShipping ? values.shippingAddress : values.billingAddress;
}

/** Errors for one step's own fields, in form order. `review` has no fields of its own. */
export function validateCheckoutStep(step: CheckoutStepId, values: CheckoutValues, flags: CheckoutFlags, options: CheckoutOptions = {}): CheckoutErrors {
  const collectBilling = options.collectBillingAddress ?? true;
  const errors: CheckoutErrors = {};
  switch (step) {
    case 'information': {
      const email = values.email.trim();
      if (!email) errors.email = getFieldError({ valueMissing: true }, { label: 'Email' }, { valueMissing: 'Enter your email address' });
      else if (!EMAIL.test(email)) errors.email = getFieldError({ typeMismatch: true }, { label: 'Email', type: 'email' });
      if (flags.needsShippingStep) Object.assign(errors, validateUsAddress(values.shippingAddress, 'shippingAddress'));
      else if (collectBilling) Object.assign(errors, validateUsAddress(values.billingAddress, 'billingAddress'));
      break;
    }
    case 'shipping':
      if (flags.needsShippingStep && !values.shippingMethodId) errors.shippingMethodId = 'Choose a shipping method';
      break;
    case 'payment':
      if (!values.paymentMethod) errors.paymentMethod = 'Choose a payment method';
      if (collectBilling && flags.needsShippingStep && !values.billingSameAsShipping) Object.assign(errors, validateUsAddress(values.billingAddress, 'billingAddress'));
      if (!values.termsAccepted) errors.termsAccepted = getFieldError({ valueMissing: true }, { label: 'Terms', type: 'checkbox' }, { valueMissing: 'Accept the terms of sale to continue' });
      if (flags.hasSubscription && !values.subscriptionTermsAccepted) errors.subscriptionTermsAccepted = 'Confirm you understand how renewal and cancellation work';
      break;
    case 'review':
      break;
  }
  return errors;
}

/** Every step before `step` (in this cart's steps) is valid. Steps not in the cart cannot be entered. */
export function canEnterStep(step: CheckoutStepId, values: CheckoutValues, flags: CheckoutFlags, options?: CheckoutOptions): boolean {
  const steps = getCheckoutSteps(flags);
  const index = steps.indexOf(step);
  if (index < 0) return false;
  return steps.slice(0, index).every((s) => Object.keys(validateCheckoutStep(s, values, flags, options)).length === 0);
}

/** The first step with errors and its errors, or null when the whole checkout is valid. */
export function firstInvalidStep(values: CheckoutValues, flags: CheckoutFlags, options?: CheckoutOptions): { step: CheckoutStepId; errors: CheckoutErrors } | null {
  for (const step of getCheckoutSteps(flags)) {
    const errors = validateCheckoutStep(step, values, flags, options);
    if (Object.keys(errors).length) return { step, errors };
  }
  return null;
}

/** What createOrderFromCart needs besides the cart and values. The caller supplies ids and the time. */
export interface OrderContext extends Omit<CartContext, 'now'> {
  orderId: string;
  orderNumber: string;
  /** ISO 8601 date-time; also the "now" for trial and renewal dates. */
  placedAt: string;
  /** Catalogue products, for digital file details. Without them each digital line gets one entry. */
  products?: readonly Product[];
}

/**
 * Builds an Order from a cart and valid checkout values (validate first: this function does not).
 * Totals come from computeCartTotals with the chosen shipping method. Digital lines produce
 * `downloads` (available now; expiry from accessDays), subscription lines produce `recurring` with the
 * first billing date, and shippable carts get the shipping address and method.
 */
export function createOrderFromCart(cart: Cart, values: CheckoutValues, ctx: OrderContext): Order {
  const priced: Cart = values.shippingMethodId ? { ...cart, shippingMethodId: values.shippingMethodId } : cart;
  const totals = computeCartTotals(priced, { promoDefinitions: ctx.promoDefinitions, shippingMethods: ctx.shippingMethods, taxRate: ctx.taxRate, now: ctx.placedAt });
  const byId = new Map((ctx.products ?? []).map((p) => [p.id, p]));
  const { flags } = totals;

  const downloads = cart.lines
    .filter((line) => line.snapshot.kind === 'digital')
    .flatMap((line) => {
      const digital = byId.get(line.productId)?.digital;
      if (!digital) return [{ fileId: line.productId, name: line.snapshot.title, available: true }];
      const expiresAt = digital.accessDays ? addDays(ctx.placedAt, digital.accessDays) : undefined;
      return digital.files.map((f) => ({ fileId: f.id, name: f.name, available: true, format: f.format, sizeBytes: f.sizeBytes, ...(expiresAt ? { expiresAt } : {}) }));
    });

  const recurring: OrderRecurringLine[] = cart.lines.flatMap((line, i) => {
    const option = line.purchaseOption;
    if (option.type !== 'subscription') return [];
    const amount = totals.lines[i]!.total;
    const trialEndsAt = option.trialDays ? addDays(ctx.placedAt, option.trialDays) : undefined;
    const firstBillingAt = trialEndsAt ?? addInterval(ctx.placedAt, option.interval);
    const per = formatRecurring(amount, option.interval);
    const note = trialEndsAt ? `Free until ${formatCommerceDate(trialEndsAt)}, then ${per}` : `${per}, next charge ${formatCommerceDate(firstBillingAt)}`;
    return [{ lineId: line.id, amount, interval: option.interval, firstBillingAt, ...(trialEndsAt ? { trialEndsAt } : {}), note }];
  });

  const billing = billingAddressFor(values, flags);
  return {
    id: ctx.orderId,
    number: ctx.orderNumber,
    placedAt: ctx.placedAt,
    status: 'processing',
    lines: cart.lines,
    totals: {
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
      ...(totals.dueToday.amount !== totals.total.amount ? { dueToday: totals.dueToday } : {}),
    },
    ...(flags.hasShippable && values.shippingAddress ? { shippingAddress: values.shippingAddress } : {}),
    ...(flags.hasShippable && totals.shippingMethod ? { shippingMethod: totals.shippingMethod } : {}),
    ...(billing ? { billingAddress: billing } : {}),
    ...(downloads.length ? { downloads } : {}),
    ...(recurring.length ? { recurring } : {}),
    ...(values.email.trim() ? { email: values.email.trim() } : {}),
  };
}


/** Per-line amounts for an order (unit price after subscription discount, line total), in the CartTotals line shape. */
export function orderLineAmounts(order: Pick<Order, 'lines'>): CartTotals['lines'] {
  return order.lines.map((line) => {
    const unitPrice = subscriptionUnitPrice(line.snapshot.unitPrice, line.purchaseOption);
    const trialDays = line.purchaseOption.type === 'subscription' ? (line.purchaseOption.trialDays ?? 0) : 0;
    return { lineId: line.id, unitPrice, total: multiply(unitPrice, line.quantity), ...(trialDays ? { trialDays } : {}) };
  });
}
