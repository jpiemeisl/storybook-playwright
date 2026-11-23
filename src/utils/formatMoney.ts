import type { Money } from '../content-types/money';

/** Options for formatMoney: locale and whether to drop a zero fraction. */
export interface FormatMoneyOptions {
  /** BCP 47 locale. Default "en-US". */
  locale?: string;
  /** Drop the fraction when it is zero: $49 instead of $49.00. Default false. */
  trimWholeAmounts?: boolean;
}

/**
 * Formats minor-unit Money for display. The number of minor digits comes from Intl for the
 * currency (2 for USD, 0 for JPY, 3 for KWD), so zero-decimal currencies need no special casing.
 * Pure and deterministic: safe to call during render and on the server.
 */
export function formatMoney(value: Money, { locale = 'en-US', trimWholeAmounts = false }: FormatMoneyOptions = {}): string {
  const base = new Intl.NumberFormat(locale, { style: 'currency', currency: value.currency });
  const minorDigits = base.resolvedOptions().maximumFractionDigits ?? 2;
  const major = value.amount / 10 ** minorDigits;

  if (trimWholeAmounts && value.amount % 10 ** minorDigits === 0) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: value.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(major);
  }
  return base.format(major);
}
