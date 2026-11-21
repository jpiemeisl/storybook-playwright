/*
 * Contract tests: every fixture validates with zero issues, the named invalid fixtures produce exactly
 * the issues they exist for, everything round-trips through JSON, and images are local.
 */
import { describe, expect, it } from 'vitest';
import { computeCartTotals } from '../logic/cart';
import { validateCart, validateCatalog, validateCustomerSubscription, validateOrder, validateProduct } from '../logic/validate';
import { getOptionAvailability } from '../logic/variants';
import { carts, catalog, customerSubscriptions, DEMO_NOW, orders, productById, promoDefinitions, reviewsForty, reviewsThree, shippingMethods } from './index';
import { invalidCarts, invalidOrders, invalidProducts } from './invalid';

const codes = (issues: { code: string; path: string }[]) => issues.map((issue) => `${issue.code}@${issue.path}`).sort();
const ctx = { promoDefinitions, shippingMethods, now: DEMO_NOW };

describe('valid fixtures', () => {
  it('the catalogue has about 18 products and 3 collections and validates', () => {
    expect(catalog.products.length).toBeGreaterThanOrEqual(18);
    expect(catalog.collections).toHaveLength(3);
    expect(validateCatalog(catalog)).toEqual([]);
  });

  it.each(catalog.products.map((p) => [p.id, p] as const))('product %s validates', (_, product) => {
    expect(validateProduct(product)).toEqual([]);
  });

  it.each(Object.entries(carts))('cart %s validates and references real products and variants', (_, cart) => {
    expect(validateCart(cart)).toEqual([]);
    for (const line of cart.lines) expect(productById(line.productId).variants.some((v) => v.id === line.variantId)).toBe(true);
  });

  it.each(Object.entries(orders))('order %s validates', (_, order) => expect(validateOrder(order)).toEqual([]));
  it.each(Object.entries(customerSubscriptions))('subscription %s validates', (_, sub) => expect(validateCustomerSubscription(sub)).toEqual([]));

  it('covers the required product cases', () => {
    const p = catalog.products;
    expect(new Set(p.map((x) => x.kind))).toEqual(new Set(['physical', 'digital', 'subscription']));
    expect(p.some((x) => x.variants.length === 40)).toBe(true);
    expect(p.some((x) => x.images.length === 0)).toBe(true);
    expect(p.some((x) => x.variants.some((v) => v.price.amount === 0))).toBe(true);
    expect(p.some((x) => x.variants.some((v) => v.price.amount === 99))).toBe(true);
    expect(p.some((x) => x.variants.some((v) => v.price.amount === 1249900))).toBe(true);
    for (const status of ['low-stock', 'out-of-stock', 'backorder', 'preorder']) expect(p.some((x) => x.variants.some((v) => v.stock.status === status)), status).toBe(true);
    expect(p.some((x) => x.rating?.count === 0)).toBe(true);
    expect(p.some((x) => x.rating?.count === 4000)).toBe(true);
    expect(p.some((x) => x.kind === 'physical' && x.purchaseOptions.some((o) => o.type === 'subscription'))).toBe(true);
    expect(p.some((x) => x.purchaseOptions.some((o) => o.type === 'subscription' && o.trialDays === 14))).toBe(true);
  });

  it('the tee has an option value that exists on no variant', () => {
    expect(getOptionAvailability(productById('prod-tee'), {}).Size!.XXL).toBe('none');
  });

  it('reviews: 3 and 40 entries, one very long, one unverified', () => {
    expect(reviewsThree).toHaveLength(3);
    expect(reviewsForty).toHaveLength(40);
    expect(reviewsForty.some((r) => r.body.length > 800)).toBe(true);
    expect(reviewsForty.some((r) => r.verified === false)).toBe(true);
  });

  it('everything round-trips through JSON unchanged', () => {
    const all = { catalog, carts, orders, customerSubscriptions, reviewsThree, reviewsForty, promoDefinitions, shippingMethods };
    expect(JSON.parse(JSON.stringify(all))).toEqual(all);
  });

  it('uses local images only', () => {
    const srcs = [...JSON.stringify({ catalog, carts, orders }).matchAll(/"src":"([^"]+)"/g)].map((m) => m[1]!);
    expect(srcs.length).toBeGreaterThan(0);
    expect(srcs.filter((src) => !src.startsWith('/commerce/images/'))).toEqual([]);
  });
});

describe('invalid fixtures are caught', () => {
  it.each(invalidProducts.map((f) => [f.name, f] as const))('product: %s', (_, f) => expect(codes(validateProduct(f.value))).toEqual([...f.expect].sort()));
  it.each(invalidCarts.map((f) => [f.name, f] as const))('cart: %s', (_, f) => expect(codes(validateCart(f.value))).toEqual([...f.expect].sort()));
  it.each(invalidOrders.map((f) => [f.name, f] as const))('order: %s', (_, f) => expect(codes(validateOrder(f.value))).toEqual([...f.expect].sort()));
});

describe('computeCartTotals on every cart fixture', () => {
  const t = (key: keyof typeof carts) => computeCartTotals(carts[key], ctx);

  it('empty', () => expect(t('empty').total.amount).toBe(0));

  it('physical only: chosen standard shipping, needs a shipping step', () => {
    const totals = t('physicalOnly');
    expect(totals.subtotal.amount).toBe(2400 + 3200 + 1800); // $74.00, just under free shipping
    expect(totals.shipping.amount).toBe(595);
    expect(totals.flags).toMatchObject({ needsShippingStep: true, isMixed: false });
  });

  it('digital only: no shipping step, no shipping', () => {
    expect(t('digitalOnly').flags.needsShippingStep).toBe(false);
    expect(t('digitalOnly').shipping.amount).toBe(0);
  });

  it('subscription only: two recurring charges, no shipping step', () => {
    const totals = t('subscriptionOnly');
    expect(totals.flags.needsShippingStep).toBe(false);
    expect(totals.recurring.map((r) => r.label)).toEqual(['$18.00 / month from Apr 21, 2026', '$54.00 every 3 months from Jun 21, 2026']);
  });

  it('mixed: all flags, subscribe-and-save discount applied', () => {
    const totals = t('mixed');
    expect(totals.flags).toEqual({ hasShippable: true, hasDigital: true, hasSubscription: true, isMixed: true, needsShippingStep: true });
    expect(totals.lines[1]!.unitPrice.amount).toBe(1190); // 1400 - 15%
  });

  it('twenty lines', () => {
    expect(carts.twentyLines.lines).toHaveLength(20);
    expect(t('twentyLines').itemCount).toBeGreaterThan(20);
  });

  it('with promo: WELCOME10 off the subtotal, SHIPFREE zeroes express shipping', () => {
    const totals = t('withPromo');
    expect(totals.discount.amount).toBe(Math.round((2 * 3200 + 14500) * 0.1));
    expect(totals.shipping.amount).toBe(0);
  });

  it('with an out-of-stock line still totals (stock is checked at checkout, not in cart math)', () => {
    expect(t('withOutOfStockLine').subtotal.amount).toBe(2400 + 8900);
  });

  it('subscription trial: the trial line is not due today', () => {
    const totals = t('subscriptionTrial');
    expect(totals.subtotal.amount).toBe(600 + 6500 + 3 * 99);
    const todayBase = 6500 + 297 + 595;
    expect(totals.dueToday.amount).toBe(todayBase + Math.round(todayBase * 0.08));
    expect(totals.recurring[0]).toMatchObject({ startsAt: '2026-04-04' });
  });
});
