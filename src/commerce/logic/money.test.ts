import { describe, expect, it } from 'vitest';
import { add, CurrencyMismatchError, InvalidAmountError, multiply, percentOf, subtract, sum } from './money';

const usd = (amount: number) => ({ amount, currency: 'USD' });

describe('money helpers', () => {
  it('adds, subtracts, multiplies and sums in minor units', () => {
    expect(add(usd(1999), usd(1))).toEqual(usd(2000));
    expect(subtract(usd(500), usd(750))).toEqual(usd(-250));
    expect(multiply(usd(1999), 3)).toEqual(usd(5997));
    expect(sum([usd(1), usd(2), usd(3)], 'USD')).toEqual(usd(6));
    expect(sum([], 'EUR')).toEqual({ amount: 0, currency: 'EUR' });
  });

  it('throws on currency mismatch', () => {
    expect(() => add(usd(1), { amount: 1, currency: 'EUR' })).toThrow(CurrencyMismatchError);
    expect(() => subtract(usd(1), { amount: 1, currency: 'EUR' })).toThrow(CurrencyMismatchError);
    expect(() => sum([usd(1), { amount: 1, currency: 'GBP' }], 'USD')).toThrow(CurrencyMismatchError);
  });

  it('rejects fractional quantities and amounts', () => {
    expect(() => multiply(usd(100), 1.5)).toThrow(InvalidAmountError);
    expect(() => add(usd(0.5), usd(1))).toThrow(InvalidAmountError);
  });

  it('rounds percentages half away from zero to the minor unit', () => {
    expect(percentOf(usd(1995), 10)).toEqual(usd(200)); // 199.5 → 200
    expect(percentOf(usd(1985), 10)).toEqual(usd(199)); // 198.5 → 199
    expect(percentOf(usd(1994), 10)).toEqual(usd(199)); // 199.4 → 199
    expect(percentOf(usd(-1995), 10)).toEqual(usd(-200)); // -199.5 → -200
    expect(percentOf(usd(5), 10)).toEqual(usd(1)); // 0.5 → 1
    expect(percentOf(usd(-5), 10)).toEqual(usd(-1));
    expect(percentOf(usd(4), 10)).toEqual(usd(0)); // 0.4 → 0
  });

  it('is exact for fractional percents where floats would drift', () => {
    expect(percentOf(usd(10050), 8)).toEqual(usd(804)); // 804.0
    expect(percentOf(usd(1000), 8.25)).toEqual(usd(83)); // 82.5 → 83
    expect(percentOf(usd(115), 7)).toEqual(usd(8)); // 8.05 → 8
    expect(percentOf(usd(35), 0.08 * 100)).toEqual(usd(3)); // 2.8 → 3, though 0.08*100 = 8.000000000000002
  });
});
