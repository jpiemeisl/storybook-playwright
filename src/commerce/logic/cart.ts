/*
 * Cart math. Pure: everything it needs (promo definitions, shipping methods, tax rate, `now`) is
 * passed in. Steps, in order:
 *   1. lines     unit price (subscription discount applied) × quantity; subtotal = all lines.
 *   2. promos    percent codes first (each on the subtotal), then fixed codes; the total discount is
 *                capped at the subtotal (never below zero); minSubtotal is checked against the
 *                subtotal; unknown codes are ignored and reported. free-shipping codes zero shipping.
 *   3. shipping  only with shippable lines: the chosen method (or the first, as an estimate); free with
 *                a free-shipping code or a subtotal >= FREE_SHIPPING_THRESHOLD (same currency).
 *   4. tax       DEMO estimate: taxRate × (subtotal - discount + shipping), rounded half away from zero.
 *   5. today     what is charged now: like the total, but trial lines contribute 0 (and are untaxed today).
 *   6. recurring subscription lines grouped by interval and start date.
 * Promo discounts apply to the first charge only, never to recurring amounts.
 */
import type { Money } from '../../content-types/money';
import { formatIsoDate } from '../../utils/formatDate';
import { formatMoney } from '../../utils/formatMoney';
import type { Cart, CartLine, PromoCode, ShippingMethod } from '../types/cart';
import type { BillingInterval } from '../types/product';
import { add, max, min, money, multiply, percentOf, subtract, sum, zero } from './money';
import { addDays, addInterval, formatInterval, subscriptionUnitPrice } from './pricing';

/** DEMO ESTIMATE ONLY: a flat 8% rate. Real tax depends on address and product and comes from a tax service. */
export const DEMO_TAX_RATE = 0.08;
/** Merchandise subtotal at or above which shipping is free ($75.00). */
export const FREE_SHIPPING_THRESHOLD: Money = { amount: 7500, currency: 'USD' };

export interface CartContext {
  promoDefinitions: readonly PromoCode[];
  shippingMethods: readonly ShippingMethod[];
  /** Fraction, default DEMO_TAX_RATE (0.08). A demo estimate, not real tax. */
  taxRate?: number;
  /** ISO 8601 date-time used for trial and renewal dates. Never read from the clock. */
  now: string;
}

export interface RecurringCharge {
  interval: BillingInterval;
  /** Per cycle, all lines with this interval and start date. */
  amount: Money;
  /** ISO date of the first recurring charge: trial end, or one interval from now. */
  startsAt?: string;
  /** e.g. "$9.00 / month from Apr 4, 2026". */
  label: string;
}

export interface CartFlags {
  hasShippable: boolean;
  hasDigital: boolean;
  /** Any subscription purchase, including subscribe-and-save on physical products. */
  hasSubscription: boolean;
  /** More than one of physical, digital and subscription products. */
  isMixed: boolean;
  /** False for digital-only and subscription-only carts. */
  needsShippingStep: boolean;
}

export interface CartTotals {
  currency: string;
  itemCount: number;
  lines: { lineId: string; unitPrice: Money; total: Money; trialDays?: number }[];
  subtotal: Money;
  discount: Money;
  shipping: Money;
  /** True when no method was chosen and the first one was used as an estimate. */
  shippingEstimated: boolean;
  shippingMethod?: ShippingMethod;
  /** Demo estimate (see DEMO_TAX_RATE). */
  tax: Money;
  /** subtotal - discount + shipping + tax. */
  total: Money;
  /** Charged at checkout: trial lines contribute 0. Equals total when there are no trials. */
  dueToday: Money;
  recurring: RecurringCharge[];
  appliedPromos: { code: string; kind: PromoCode['kind']; amount: Money }[];
  promoIssues: { code: string; reason: 'unknown' | 'min-subtotal' | 'duplicate' }[];
  flags: CartFlags;
  freeShippingProgress: { threshold: Money; remaining: Money; reached: boolean };
}

const trialDaysOf = (line: CartLine) => (line.purchaseOption.type === 'subscription' ? (line.purchaseOption.trialDays ?? 0) : 0);

/** Step 1: per-line amounts and the subtotal. */
function lineAmounts(cart: Cart) {
  const lines = cart.lines.map((line) => {
    const unitPrice = subscriptionUnitPrice(line.snapshot.unitPrice, line.purchaseOption);
    const trialDays = trialDaysOf(line);
    return { lineId: line.id, unitPrice, total: multiply(unitPrice, line.quantity), ...(trialDays ? { trialDays } : {}) };
  });
  return { lines, subtotal: sum(lines.map((l) => l.total), cart.currency) };
}

/** Step 2: promo codes, percent before fixed, capped at the subtotal. */
function applyPromos(cart: Cart, subtotal: Money, definitions: readonly PromoCode[]) {
  const applied: CartTotals['appliedPromos'] = [];
  const issues: CartTotals['promoIssues'] = [];
  const seen = new Set<string>();
  const found: PromoCode[] = [];
  for (const entered of cart.promoCodes) {
    const key = entered.trim().toUpperCase();
    const definition = definitions.find((d) => d.code.toUpperCase() === key);
    if (seen.has(key)) issues.push({ code: entered, reason: 'duplicate' });
    else if (!definition) issues.push({ code: entered, reason: 'unknown' });
    else if (definition.minSubtotal && subtotal.amount < definition.minSubtotal) issues.push({ code: definition.code, reason: 'min-subtotal' });
    else found.push(definition);
    seen.add(key);
  }
  let remaining = subtotal;
  const order = ['percent', 'fixed', 'free-shipping'] as const;
  for (const kind of order) {
    for (const definition of found.filter((d) => d.kind === kind)) {
      let amount = zero(cart.currency);
      if (kind === 'percent') amount = percentOf(subtotal, definition.value ?? 0);
      if (kind === 'fixed') amount = money(definition.value ?? 0, cart.currency);
      amount = min(amount, remaining); // never below zero
      remaining = subtract(remaining, amount);
      applied.push({ code: definition.code, kind, amount });
    }
  }
  return { discount: subtract(subtotal, remaining), applied, issues, freeShipping: found.some((d) => d.kind === 'free-shipping') };
}

/** Step 3: shipping. */
function shippingFor(cart: Cart, subtotal: Money, freeShippingCode: boolean, methods: readonly ShippingMethod[], hasShippable: boolean) {
  const reached = cart.currency === FREE_SHIPPING_THRESHOLD.currency && subtotal.amount >= FREE_SHIPPING_THRESHOLD.amount;
  if (!hasShippable) return { shipping: zero(cart.currency), estimated: false, method: undefined, reached };
  const chosen = methods.find((m) => m.id === cart.shippingMethodId);
  const method = chosen ?? methods[0];
  const price = method ? method.price : zero(cart.currency);
  return { shipping: freeShippingCode || reached ? zero(cart.currency) : price, estimated: !chosen && !!method, method, reached };
}

/** Step 6: recurring charges grouped by interval and start date. */
function recurringFor(cart: Cart, lines: CartTotals['lines'], now: string): RecurringCharge[] {
  const groups = new Map<string, RecurringCharge>();
  cart.lines.forEach((line, i) => {
    const option = line.purchaseOption;
    if (option.type !== 'subscription') return;
    const startsAt = option.trialDays ? addDays(now, option.trialDays) : addInterval(now, option.interval);
    const key = `${option.interval.count}-${option.interval.unit}-${startsAt}`;
    const existing = groups.get(key);
    const amount = existing ? add(existing.amount, lines[i]!.total) : lines[i]!.total;
    groups.set(key, { interval: option.interval, amount, startsAt, label: '' });
  });
  return [...groups.values()].map((charge) => ({
    ...charge,
    label: `${formatMoney(charge.amount)} ${charge.interval.count === 1 ? `/ ${charge.interval.unit}` : formatInterval(charge.interval)} from ${formatIsoDate(charge.startsAt!)}`,
  }));
}

function flagsFor(cart: Cart): CartFlags {
  const kinds = new Set(cart.lines.map((l) => l.snapshot.kind));
  const hasShippable = cart.lines.some((l) => l.snapshot.requiresShipping);
  return {
    hasShippable,
    hasDigital: kinds.has('digital'),
    hasSubscription: cart.lines.some((l) => l.purchaseOption.type === 'subscription'),
    isMixed: kinds.size > 1,
    needsShippingStep: hasShippable,
  };
}

/** Totals, flags and recurring charges for a cart. Throws CurrencyMismatchError if a line is not in the cart currency. */
export function computeCartTotals(cart: Cart, ctx: CartContext): CartTotals {
  const { currency } = cart;
  const taxRate = ctx.taxRate ?? DEMO_TAX_RATE;
  const flags = flagsFor(cart);
  const { lines, subtotal } = lineAmounts(cart);
  const promos = applyPromos(cart, subtotal, ctx.promoDefinitions);
  const ship = shippingFor(cart, subtotal, promos.freeShipping, ctx.shippingMethods, flags.hasShippable);
  const taxable = add(subtract(subtotal, promos.discount), ship.shipping);
  const tax = percentOf(taxable, taxRate * 100);

  // Step 5: today's charge excludes trial lines (their tax is charged when they first bill).
  const trialAmount = sum(lines.filter((l) => l.trialDays).map((l) => l.total), currency);
  const chargeableNow = subtract(subtotal, trialAmount);
  const todayBase = add(subtract(chargeableNow, min(promos.discount, chargeableNow)), ship.shipping);
  const dueToday = trialAmount.amount === 0 ? add(taxable, tax) : add(todayBase, percentOf(todayBase, taxRate * 100));

  const threshold = currency === FREE_SHIPPING_THRESHOLD.currency ? FREE_SHIPPING_THRESHOLD : money(0, currency);
  return {
    currency,
    itemCount: cart.lines.reduce((n, l) => n + l.quantity, 0),
    lines,
    subtotal,
    discount: promos.discount,
    shipping: ship.shipping,
    shippingEstimated: ship.estimated,
    shippingMethod: ship.method,
    tax,
    total: add(taxable, tax),
    dueToday,
    recurring: recurringFor(cart, lines, ctx.now),
    appliedPromos: promos.applied,
    promoIssues: promos.issues,
    flags,
    freeShippingProgress: { threshold, remaining: max(subtract(threshold, subtotal), zero(currency)), reached: ship.reached },
  };
}
