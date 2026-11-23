/*
 * Money arithmetic in integer minor units. Never floating-point dollars: percentages are computed
 * exactly with BigInt and rounded half away from zero to the minor unit. Every binary operation
 * throws CurrencyMismatchError when currencies differ.
 */
import type { Money } from '../../content-types/money';

/** Thrown when a binary money operation receives two values in different currencies; carries both currency codes. */
export class CurrencyMismatchError extends Error {
  constructor(
    readonly expected: string,
    readonly received: string,
  ) {
    super(`Currency mismatch: expected ${expected}, received ${received}.`);
    this.name = 'CurrencyMismatchError';
  }
}

/** Thrown when an amount, quantity or percent is not a safe integer (or, for percent, not finite). */
export class InvalidAmountError extends Error {
  constructor(value: number, what = 'amount') {
    super(`Invalid ${what}: ${value} (must be a safe integer).`);
    this.name = 'InvalidAmountError';
  }
}

const checkInteger = (value: number, what?: string) => {
  if (!Number.isSafeInteger(value)) throw new InvalidAmountError(value, what);
};

const sameCurrency = (a: Money, b: Money) => {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency);
};

/** Creates a Money value from an integer amount in minor units (cents); throws InvalidAmountError for non-integers. */
export const money = (amount: number, currency: string): Money => {
  checkInteger(amount);
  return { amount, currency };
};

/** Returns a zero Money value in the given currency. */
export const zero = (currency: string): Money => ({ amount: 0, currency });

/** Returns `a + b` in minor units; pure, and throws CurrencyMismatchError when currencies differ. */
export function add(a: Money, b: Money): Money {
  sameCurrency(a, b);
  return money(a.amount + b.amount, a.currency);
}

/** Returns `a - b` in minor units (may be negative); pure, and throws CurrencyMismatchError when currencies differ. */
export function subtract(a: Money, b: Money): Money {
  sameCurrency(a, b);
  return money(a.amount - b.amount, a.currency);
}

/** Price × quantity. `quantity` must be an integer. */
export function multiply(price: Money, quantity: number): Money {
  checkInteger(price.amount);
  checkInteger(quantity, 'quantity');
  return money(price.amount * quantity, price.currency);
}

/** Sum of a list; `currency` is required so an empty list has one. */
export function sum(values: readonly Money[], currency: string): Money {
  return values.reduce((total, value) => add(total, value), zero(currency));
}

/** Divides integers rounding half away from zero (2.5 → 3, -2.5 → -3). */
function divideRounded(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  if (remainder === 0n) return quotient;
  const absRemainder2 = (remainder < 0n ? -remainder : remainder) * 2n;
  if (absRemainder2 >= denominator) return quotient + (numerator < 0n ? -1n : 1n);
  return quotient;
}

/**
 * `percent`% of a money value, rounded half away from zero to the minor unit. Percent may be
 * fractional (8.25) up to six decimal places; it is scaled to an integer so no float error leaks in.
 * Examples: 10% of 1995 = 199.5 → 200; 10% of -1995 → -200.
 */
export function percentOf(value: Money, percent: number): Money {
  checkInteger(value.amount);
  if (!Number.isFinite(percent)) throw new InvalidAmountError(percent, 'percent');
  const micro = BigInt(Math.round(percent * 1_000_000));
  const result = divideRounded(BigInt(value.amount) * micro, 100_000_000n);
  return money(Number(result), value.currency);
}

/** True when the amount is exactly zero minor units. */
export const isZero = (value: Money) => value.amount === 0;
/** Returns the smaller of two same-currency values (`a` on a tie); throws CurrencyMismatchError when currencies differ. */
export const min = (a: Money, b: Money): Money => (sameCurrency(a, b), a.amount <= b.amount ? a : b);
/** Returns the larger of two same-currency values (`a` on a tie); throws CurrencyMismatchError when currencies differ. */
export const max = (a: Money, b: Money): Money => (sameCurrency(a, b), a.amount >= b.amount ? a : b);
