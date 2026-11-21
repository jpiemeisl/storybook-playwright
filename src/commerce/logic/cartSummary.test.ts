import { describe, expect, it } from 'vitest';
import { carts, DEMO_NOW, promoDefinitions, shippingMethods, type CartFixtureKey } from '../fixtures';
import { computeCartTotals } from './cart';
import { summaryRows, thenBilled } from './cartSummary';
import { add, subtract, zero } from './money';

const totalsOf = (key: CartFixtureKey) => computeCartTotals(carts[key], { promoDefinitions, shippingMethods, now: DEMO_NOW });
const keysOf = (key: CartFixtureKey, shippingKnown?: boolean) => summaryRows(totalsOf(key), { shippingKnown }).map((r) => r.key);

describe('summaryRows', () => {
  it('never has a shipping row for carts that ship nothing', () => {
    expect(keysOf('digitalOnly')).toEqual(['subtotal', 'tax', 'dueToday']);
    expect(keysOf('subscriptionOnly')).toEqual(['subtotal', 'tax', 'dueToday']);
  });

  it('labels shipping as an estimate before an address is known, and keeps the rows adding up', () => {
    const shipping = summaryRows(totalsOf('physicalOnly'), { shippingKnown: false }).find((r) => r.key === 'shipping');
    expect(shipping).toEqual({ key: 'shipping', label: 'Estimated shipping', amount: { amount: 595, currency: 'USD' }, note: 'Standard. Calculated at checkout from your address.' });
    expect(summaryRows(totalsOf('freeShippingAt'), { shippingKnown: false }).find((r) => r.key === 'shipping')).toMatchObject({ text: 'Free' });
  });

  it('shows the amount and method, or "Free" with the reason', () => {
    expect(summaryRows(totalsOf('physicalOnly')).find((r) => r.key === 'shipping')).toMatchObject({ amount: { amount: 595 }, note: 'Standard' });
    expect(summaryRows(totalsOf('freeShippingAt')).find((r) => r.key === 'shipping')).toMatchObject({ text: 'Free', note: 'Orders over $75.00 ship free' });
    expect(summaryRows(totalsOf('withPromo')).find((r) => r.key === 'shipping')).toMatchObject({ label: 'Shipping (SHIPFREE)', text: 'Free', note: 'SHIPFREE applied' });
  });

  it('lists discounts by code and leaves free-shipping codes to the shipping row', () => {
    expect(summaryRows(totalsOf('withPromo')).filter((r) => r.key === 'discount').map((r) => r.label)).toEqual(['Discount (WELCOME10)']);
  });

  it('adds a trial deduction so the rows add up to Due today, with shipping known or estimated', () => {
    for (const key of Object.keys(carts) as CartFixtureKey[]) {
      const totals = totalsOf(key);
      for (const shippingKnown of [true, false]) {
        const sum = summaryRows(totals, { shippingKnown }).reduce((acc, row) => {
          if (row.key === 'dueToday' || !row.amount) return acc;
          return row.key === 'discount' || row.key === 'trial' ? subtract(acc, row.amount) : add(acc, row.amount);
        }, zero('USD'));
        expect(sum, `${key} ${shippingKnown}`).toEqual(totals.dueToday);
      }
    }
    expect(keysOf('subscriptionWithTrial')).toEqual(['subtotal', 'trial', 'tax', 'dueToday']);
  });
});

describe('thenBilled', () => {
  it('groups recurring charges with dates and trial notes', () => {
    expect(thenBilled(totalsOf('subscriptionWithTrial'))).toEqual([
      { text: '$6.00 every month starting Apr 4, 2026', note: 'After your 14-day free trial. Cancel before Apr 4, 2026 to pay nothing.' },
      { text: '$18.00 every month starting Apr 21, 2026' },
    ]);
    expect(thenBilled(totalsOf('multipleIntervals')).map((i) => i.text)).toEqual([
      '$12.60 every week starting Mar 28, 2026',
      '$18.00 every month starting Apr 21, 2026',
      '$54.00 every 3 months starting Jun 21, 2026',
      '$192.00 every year starting Mar 21, 2027',
    ]);
    expect(thenBilled(totalsOf('physicalOnly'))).toEqual([]);
  });
});
