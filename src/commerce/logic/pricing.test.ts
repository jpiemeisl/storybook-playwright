import { describe, expect, it } from 'vitest';
import { CurrencyMismatchError } from './money';
import { addDays, addInterval, formatInterval, formatRecurring, formatTrial, percentOff, subscriptionUnitPrice } from './pricing';

const usd = (amount: number) => ({ amount, currency: 'USD' });

describe('percentOff', () => {
  it('rounds down to a whole percent', () => {
    expect(percentOff(usd(1900), usd(2500))).toBe(24);
    expect(percentOff(usd(2000), usd(2500))).toBe(20);
    expect(percentOff(usd(1), usd(3))).toBe(66);
  });

  it('is 0 without a higher compare-at price', () => {
    expect(percentOff(usd(2500), undefined)).toBe(0);
    expect(percentOff(usd(2500), usd(2500))).toBe(0);
    expect(percentOff(usd(2500), usd(2000))).toBe(0);
    expect(percentOff(usd(0), usd(0))).toBe(0);
  });

  it('throws on currency mismatch', () => {
    expect(() => percentOff(usd(100), { amount: 200, currency: 'EUR' })).toThrow(CurrencyMismatchError);
  });
});

describe('subscriptionUnitPrice', () => {
  it('applies the discount with half-away-from-zero rounding', () => {
    expect(subscriptionUnitPrice(usd(1995), { type: 'subscription', interval: { unit: 'month', count: 1 }, discountPercent: 10 })).toEqual(usd(1795));
    expect(subscriptionUnitPrice(usd(1500), { type: 'subscription', interval: { unit: 'month', count: 3 }, discountPercent: 15 })).toEqual(usd(1275));
  });

  it('leaves one-time and undiscounted options alone', () => {
    expect(subscriptionUnitPrice(usd(1995), { type: 'one-time' })).toEqual(usd(1995));
    expect(subscriptionUnitPrice(usd(1995), { type: 'subscription', interval: { unit: 'week', count: 1 } })).toEqual(usd(1995));
  });
});

describe('formatting', () => {
  it('formats intervals', () => {
    expect(formatInterval({ unit: 'month', count: 1 })).toBe('month');
    expect(formatInterval({ unit: 'month', count: 3 })).toBe('every 3 months');
    expect(formatInterval({ unit: 'year', count: 1 })).toBe('year');
    expect(formatInterval({ unit: 'week', count: 2 })).toBe('every 2 weeks');
  });

  it('formats recurring prices and trials', () => {
    expect(formatRecurring(usd(900), { unit: 'month', count: 1 })).toBe('$9.00 / month');
    expect(formatRecurring(usd(2400), { unit: 'month', count: 3 })).toBe('$24.00 every 3 months');
    expect(formatTrial(14)).toBe('Free for 14 days');
    expect(formatTrial(1)).toBe('Free for 1 day');
    expect(formatTrial(0)).toBe('');
    expect(formatTrial(undefined)).toBe('');
  });
});

describe('date helpers', () => {
  it('adds days and intervals in UTC', () => {
    expect(addDays('2026-03-21T10:00:00Z', 14)).toBe('2026-04-04');
    expect(addInterval('2026-01-31', { unit: 'month', count: 1 })).toBe('2026-02-28');
    expect(addInterval('2026-03-21', { unit: 'month', count: 3 })).toBe('2026-06-21');
    expect(addInterval('2024-02-29', { unit: 'year', count: 1 })).toBe('2025-02-28');
    expect(addInterval('2026-03-21', { unit: 'week', count: 2 })).toBe('2026-04-04');
  });
});
