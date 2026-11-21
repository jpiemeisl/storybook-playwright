/**
 * An amount of money in the currency's minor unit (cents for USD, yen for JPY, fils for KWD),
 * so values stay integers and never pick up floating-point drift.
 */
export interface Money {
  /** Integer amount in minor units, e.g. 1999 = $19.99, 1500 = ¥1,500. */
  amount: number;
  /** ISO 4217 code, e.g. "USD", "EUR", "JPY". */
  currency: string;
}
