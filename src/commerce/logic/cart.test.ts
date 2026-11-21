import { describe, expect, it } from 'vitest';
import type { Cart, CartLine, PromoCode, ShippingMethod } from '../types/cart';
import type { PurchaseOption } from '../types/product';
import { computeCartTotals, FREE_SHIPPING_THRESHOLD } from './cart';
import { CurrencyMismatchError } from './money';

const usd = (amount: number) => ({ amount, currency: 'USD' });
const promos: PromoCode[] = [
  { code: 'WELCOME10', kind: 'percent', value: 10, description: '10% off' },
  { code: 'FIVEOFF', kind: 'fixed', value: 500, minSubtotal: 2500, description: '$5 off orders over $25' },
  { code: 'SHIPFREE', kind: 'free-shipping', description: 'Free shipping' },
];
const shipping: ShippingMethod[] = [
  { id: 'standard', label: 'Standard', price: usd(595) },
  { id: 'express', label: 'Express', price: usd(1495) },
];
const ctx = { promoDefinitions: promos, shippingMethods: shipping, now: '2026-03-21T09:00:00Z' };

let n = 0;
function line(kind: CartLine['snapshot']['kind'], unit: number, quantity = 1, purchaseOption: PurchaseOption = { type: 'one-time' }): CartLine {
  n += 1;
  return { id: `l${n}`, productId: `p${n}`, variantId: `v${n}`, quantity, purchaseOption, snapshot: { title: `Item ${n}`, unitPrice: usd(unit), kind, requiresShipping: kind === 'physical' } };
}
const cart = (lines: CartLine[], extra: Partial<Cart> = {}): Cart => ({ id: 'c', lines, promoCodes: [], currency: 'USD', ...extra });
const monthly = (extra: Partial<Extract<PurchaseOption, { type: 'subscription' }>> = {}): PurchaseOption => ({ type: 'subscription', interval: { unit: 'month', count: 1 }, ...extra });

describe('computeCartTotals', () => {
  it('empty cart: all zero, no shipping step', () => {
    const t = computeCartTotals(cart([]), ctx);
    expect([t.subtotal, t.discount, t.shipping, t.tax, t.total, t.dueToday].map((m) => m.amount)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(t.flags).toEqual({ hasShippable: false, hasDigital: false, hasSubscription: false, isMixed: false, needsShippingStep: false });
    expect(t.recurring).toEqual([]);
    expect(t.freeShippingProgress).toEqual({ threshold: FREE_SHIPPING_THRESHOLD, remaining: usd(7500), reached: false });
  });

  it('physical cart: subtotal, estimated first shipping method and 8% tax', () => {
    const t = computeCartTotals(cart([line('physical', 2000, 2)]), ctx);
    expect(t.subtotal).toEqual(usd(4000));
    expect(t.shipping).toEqual(usd(595));
    expect(t.shippingEstimated).toBe(true);
    expect(t.tax).toEqual(usd(368)); // 8% of 4595 = 367.6 → 368
    expect(t.total).toEqual(usd(4963));
    expect(t.dueToday).toEqual(t.total);
  });

  it('uses the chosen shipping method', () => {
    const t = computeCartTotals(cart([line('physical', 2000)], { shippingMethodId: 'express' }), ctx);
    expect(t.shipping).toEqual(usd(1495));
    expect(t.shippingEstimated).toBe(false);
  });

  it('free shipping from exactly $75.00, not one cent below', () => {
    const at = computeCartTotals(cart([line('physical', 7500)]), ctx);
    expect(at.shipping).toEqual(usd(0));
    expect(at.freeShippingProgress).toMatchObject({ remaining: usd(0), reached: true });
    const below = computeCartTotals(cart([line('physical', 7499)]), ctx);
    expect(below.shipping).toEqual(usd(595));
    expect(below.freeShippingProgress).toMatchObject({ remaining: usd(1), reached: false });
  });

  it('digital-only and subscription-only carts need no shipping step and pay no shipping', () => {
    const digital = computeCartTotals(cart([line('digital', 1500)]), ctx);
    expect(digital.flags).toMatchObject({ hasDigital: true, hasShippable: false, needsShippingStep: false, isMixed: false });
    expect(digital.shipping).toEqual(usd(0));
    const sub = computeCartTotals(cart([line('subscription', 900, 1, monthly())]), ctx);
    expect(sub.flags).toMatchObject({ hasSubscription: true, needsShippingStep: false });
  });

  it('mixed cart sets isMixed', () => {
    const t = computeCartTotals(cart([line('physical', 1000), line('digital', 1000), line('subscription', 900, 1, monthly())]), ctx);
    expect(t.flags).toEqual({ hasShippable: true, hasDigital: true, hasSubscription: true, isMixed: true, needsShippingStep: true });
  });

  it('subscribe-and-save on a physical product counts as a subscription but not as mixed', () => {
    const t = computeCartTotals(cart([line('physical', 2000, 1, monthly({ discountPercent: 10 }))]), ctx);
    expect(t.flags).toMatchObject({ hasSubscription: true, isMixed: false, hasShippable: true });
    expect(t.subtotal).toEqual(usd(1800));
  });

  describe('promos', () => {
    it('applies percent before fixed', () => {
      const t = computeCartTotals(cart([line('digital', 10000)], { promoCodes: ['FIVEOFF', 'WELCOME10'] }), ctx);
      expect(t.appliedPromos.map((p) => [p.code, p.amount.amount])).toEqual([['WELCOME10', 1000], ['FIVEOFF', 500]]);
      expect(t.discount).toEqual(usd(1500));
    });

    it('matches case-insensitively and reports unknown and duplicate codes', () => {
      const t = computeCartTotals(cart([line('digital', 10000)], { promoCodes: ['welcome10', 'NOPE', 'Welcome10'] }), ctx);
      expect(t.discount).toEqual(usd(1000));
      expect(t.promoIssues).toEqual([{ code: 'NOPE', reason: 'unknown' }, { code: 'Welcome10', reason: 'duplicate' }]);
    });

    it('respects minSubtotal', () => {
      const t = computeCartTotals(cart([line('digital', 2000)], { promoCodes: ['FIVEOFF'] }), ctx);
      expect(t.discount).toEqual(usd(0));
      expect(t.promoIssues).toEqual([{ code: 'FIVEOFF', reason: 'min-subtotal' }]);
    });

    it('never discounts below zero', () => {
      const t = computeCartTotals(cart([line('digital', 300)], { promoCodes: ['FIVEOFF'] }), { ...ctx, promoDefinitions: [{ ...promos[1]!, minSubtotal: undefined }] });
      expect(t.discount).toEqual(usd(300));
      expect(t.total).toEqual(usd(0));
    });

    it('free-shipping code zeroes shipping and discounts nothing else', () => {
      const t = computeCartTotals(cart([line('physical', 2000)], { promoCodes: ['SHIPFREE'] }), ctx);
      expect(t.shipping).toEqual(usd(0));
      expect(t.discount).toEqual(usd(0));
    });
  });

  it('tax is 8% of (subtotal - discount + shipping), rounded half away from zero', () => {
    const t = computeCartTotals(cart([line('physical', 1906)], { promoCodes: ['WELCOME10'] }), ctx);
    // subtotal 1906, discount 191 (190.6), shipping 595 → 2310 × 8% = 184.8 → 185
    expect([t.discount.amount, t.tax.amount, t.total.amount]).toEqual([191, 185, 2495]);
    const half = computeCartTotals(cart([line('digital', 1000)]), { ...ctx, taxRate: 0.0825 });
    expect(half.tax).toEqual(usd(83)); // 82.5 → 83
  });

  it('trial lines contribute 0 to dueToday and start recurring at the trial end', () => {
    const t = computeCartTotals(cart([line('digital', 1000), line('subscription', 900, 1, monthly({ trialDays: 14 }))]), ctx);
    expect(t.subtotal).toEqual(usd(1900));
    expect(t.dueToday).toEqual(usd(1080)); // 1000 + 8%
    expect(t.recurring).toEqual([{ interval: { unit: 'month', count: 1 }, amount: usd(900), startsAt: '2026-04-04', label: '$9.00 / month from Apr 4, 2026' }]);
  });

  it('a trial-only cart is due 0 today', () => {
    const t = computeCartTotals(cart([line('subscription', 900, 1, monthly({ trialDays: 14 }))]), ctx);
    expect(t.dueToday).toEqual(usd(0));
  });

  it('groups recurring charges by interval and start date', () => {
    const quarterly: PurchaseOption = { type: 'subscription', interval: { unit: 'month', count: 3 }, discountPercent: 10 };
    const t = computeCartTotals(cart([line('subscription', 900, 1, monthly()), line('subscription', 500, 2, monthly()), line('subscription', 3000, 1, quarterly)]), ctx);
    expect(t.recurring.map((r) => [r.label, r.amount.amount])).toEqual([
      ['$19.00 / month from Apr 21, 2026', 1900],
      ['$27.00 every 3 months from Jun 21, 2026', 2700],
    ]);
  });

  it('throws when a line is in another currency', () => {
    const bad = line('digital', 100);
    bad.snapshot.unitPrice = { amount: 100, currency: 'EUR' };
    expect(() => computeCartTotals(cart([bad]), ctx)).toThrow(CurrencyMismatchError);
  });
});
