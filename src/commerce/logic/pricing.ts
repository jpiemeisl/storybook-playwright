import type { Money } from '../../content-types/money';
import type { BillingInterval, PurchaseOption } from '../types/product';
import { formatIsoDate } from '../../utils/formatDate';
import { formatMoney } from '../../utils/formatMoney';
import { percentOf, subtract } from './money';

/**
 * Whole percent saved versus the compare-at price, rounded down so "Save 20%" is never overstated.
 * 0 when there is no compare-at price or it is not higher. Throws on currency mismatch.
 */
export function percentOff(price: Money, compareAt: Money | undefined): number {
  if (!compareAt) return 0;
  if (compareAt.currency !== price.currency) subtract(price, compareAt); // throws CurrencyMismatchError
  if (compareAt.amount <= price.amount || compareAt.amount <= 0) return 0;
  return Math.floor(((compareAt.amount - price.amount) * 100) / compareAt.amount);
}

/** Unit price for a purchase option: subscription discounts are applied (rounded half away from zero). */
export function subscriptionUnitPrice(variantPrice: Money, option: PurchaseOption): Money {
  if (option.type !== 'subscription' || !option.discountPercent) return variantPrice;
  return subtract(variantPrice, percentOf(variantPrice, option.discountPercent));
}

/** "week", "month", "year" for one unit; "every 2 weeks", "every 3 months" otherwise. */
export function formatInterval(interval: BillingInterval): string {
  return interval.count === 1 ? interval.unit : `every ${interval.count} ${interval.unit}s`;
}

/** "$9.00 / month" or "$24.00 every 3 months". */
export function formatRecurring(price: Money, interval: BillingInterval): string {
  const amount = formatMoney(price);
  return interval.count === 1 ? `${amount} / ${interval.unit}` : `${amount} ${formatInterval(interval)}`;
}

/** "Free for 14 days", "Free for 1 day"; "" for no trial. */
export function formatTrial(days: number | undefined): string {
  if (!days || days <= 0) return '';
  return `Free for ${days} ${days === 1 ? 'day' : 'days'}`;
}

/** ISO date (YYYY-MM-DD) `days` after an ISO date or date-time, in UTC. Pure: no clock. */
export function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** ISO date one billing interval after `iso`, in UTC (month ends clamp to the last day). */
export function addInterval(iso: string, interval: BillingInterval): string {
  const date = new Date(iso);
  if (interval.unit === 'week') return addDays(iso, 7 * interval.count);
  const months = interval.unit === 'year' ? 12 * interval.count : interval.count;
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}

/** "Mar 14, 2026" for a date shown in stock or billing messages (deterministic, UTC). */
export const formatCommerceDate = (iso: string) => formatIsoDate(iso);
