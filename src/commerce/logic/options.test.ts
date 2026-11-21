import { describe, expect, it } from 'vitest';
import { club, coffee, guide, mug, plannerApp, seedBox, socks, tee } from '../fixtures';
import { defaultPurchaseOption, formatBytes, intervalName, optionDisplay, optionSummary, purchaseOptionKey, purchaseOptionText, purchaseSelectorKind, savingsVsMonthly } from './options';

describe('savingsVsMonthly', () => {
  const variant = club.variants[0]!;
  it('compares longer intervals with paying monthly for the same period', () => {
    expect(savingsVsMonthly(club, variant, club.purchaseOptions[0]!)).toBeNull(); // monthly itself
    expect(savingsVsMonthly(club, variant, club.purchaseOptions[1]!)).toBe(10); // 5400 vs 3 × 2000
    expect(savingsVsMonthly(club, variant, club.purchaseOptions[2]!)).toBe(20); // 19200 vs 12 × 2000
  });

  it('is null without a monthly baseline or for weekly options', () => {
    expect(savingsVsMonthly(coffee, coffee.variants[0]!, coffee.purchaseOptions[1]!)).toBeNull();
    expect(savingsVsMonthly(mug, mug.variants[0]!, { type: 'one-time' })).toBeNull();
  });
});

describe('purchase option helpers', () => {
  it('chooses the default option and the selector kind by product kind', () => {
    expect(defaultPurchaseOption(seedBox).type).toBe('subscription');
    expect(defaultPurchaseOption(coffee).type).toBe('one-time');
    expect(purchaseSelectorKind(club)).toBe('interval');
    expect(purchaseSelectorKind(seedBox)).toBe('none');
    expect(purchaseSelectorKind(coffee)).toBe('options');
    expect(purchaseSelectorKind(guide)).toBe('none');
  });

  it('describes options with prices from the data', () => {
    expect(purchaseOptionText({ type: 'one-time' }, coffee.variants[0]!.price)).toEqual({ title: 'One-time purchase', detail: '$14.00', price: { amount: 1400, currency: 'USD' } });
    expect(purchaseOptionText(coffee.purchaseOptions[2]!, coffee.variants[0]!.price)).toMatchObject({ title: 'Subscribe and save 15%', detail: 'Delivered every month · $11.90 / month' });
    expect(purchaseOptionText(plannerApp.purchaseOptions[0]!, plannerApp.variants[0]!.price).detail).toBe('Delivered every month · $6.00 / month · Free for 14 days, then billed');
  });

  it('interval names and keys', () => {
    expect([{ unit: 'month', count: 1 }, { unit: 'month', count: 3 }, { unit: 'year', count: 1 }, { unit: 'week', count: 2 }].map((i) => intervalName(i as never))).toEqual(['Monthly', 'Quarterly', 'Annual', 'Every 2 weeks']);
    expect(new Set(club.purchaseOptions.map(purchaseOptionKey)).size).toBe(3);
  });
});

describe('option display and summary', () => {
  it('defaults to select for 12+ values', () => {
    expect(optionDisplay({ name: 'Size', values: ['S', 'M'] })).toBe('buttons');
    expect(optionDisplay({ name: 'Size', values: Array.from({ length: 12 }, (_, i) => String(i)) })).toBe('select');
    expect(optionDisplay({ name: 'Colour', values: ['A'], display: 'swatches' })).toBe('swatches');
  });

  it('summarises the largest option', () => {
    expect(optionSummary(socks)).toBe('8 sizes');
    expect(optionSummary(tee)).toBe('5 sizes');
    expect(optionSummary(mug)).toBeUndefined();
    expect(optionSummary({ ...mug, options: [{ name: 'Colour', values: ['A', 'B', 'C', 'D'] }] })).toBe('4 colours');
    expect(optionSummary({ ...mug, options: [{ name: 'Accessory', values: ['A', 'B'] }] })).toBe('2 accessories');
  });
});

describe('formatBytes', () => {
  it('uses decimal units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(999)).toBe('999 B');
    expect(formatBytes(640_000)).toBe('640 KB');
    expect(formatBytes(18_400_000)).toBe('18.4 MB');
    expect(formatBytes(1_500_000_000)).toBe('1.5 GB');
    expect(formatBytes(-1)).toBe('');
    expect(formatBytes(Number.NaN)).toBe('');
  });
});
