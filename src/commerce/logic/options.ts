/*
 * Purchase option and display helpers for product pages. Pure; numbers come from product data.
 */
import type { Money } from '../../content-types/money';
import { formatMoney } from '../../utils/formatMoney';
import type { BillingInterval, Product, ProductOption, PurchaseOption, SubscriptionPurchase, Variant } from '../types/product';
import { formatInterval, formatRecurring, formatTrial, subscriptionUnitPrice } from './pricing';

/** Months in one billing cycle (weeks are not comparable to months: undefined). */
function monthsIn(interval: BillingInterval): number | undefined {
  if (interval.unit === 'month') return interval.count;
  if (interval.unit === 'year') return interval.count * 12;
  return undefined;
}

/**
 * Whole percent an option saves compared with paying monthly for the same period (rounded down).
 * Null when the product has no monthly option, the option is not month/year based, or it saves nothing.
 */
export function savingsVsMonthly(product: Product, variant: Variant, option: PurchaseOption): number | null {
  if (option.type !== 'subscription') return null;
  const monthly = product.purchaseOptions.find((o): o is SubscriptionPurchase => o.type === 'subscription' && o.interval.unit === 'month' && o.interval.count === 1);
  const months = monthsIn(option.interval);
  if (!monthly || !months || months === 1) return null;
  const baseline = subscriptionUnitPrice(variant.price, monthly).amount * months;
  const cost = subscriptionUnitPrice(variant.price, option).amount;
  if (baseline <= 0 || cost >= baseline) return null;
  return Math.floor(((baseline - cost) * 100) / baseline);
}

/** The purchase option a product page starts with: the first subscription option for subscription products, else one-time. */
export function defaultPurchaseOption(product: Product): PurchaseOption {
  if (product.kind === 'subscription') return product.purchaseOptions.find((o) => o.type === 'subscription') ?? product.purchaseOptions[0]!;
  return product.purchaseOptions.find((o) => o.type === 'one-time') ?? product.purchaseOptions[0] ?? { type: 'one-time' };
}

/** Which selector the product page shows: interval tabs for subscription products with several intervals, cards for subscribe-and-save, nothing otherwise. */
export function purchaseSelectorKind(product: Product): 'interval' | 'options' | 'none' {
  const subscriptions = product.purchaseOptions.filter((o) => o.type === 'subscription');
  if (product.kind === 'subscription') return subscriptions.length > 1 ? 'interval' : 'none';
  return subscriptions.length > 0 ? 'options' : 'none';
}

/** A stable key for a purchase option (used as a radio value). */
export function purchaseOptionKey(option: PurchaseOption): string {
  if (option.type === 'one-time') return 'one-time';
  return `sub-${option.interval.count}-${option.interval.unit}-${option.discountPercent ?? 0}-${option.trialDays ?? 0}-${option.priceMultiplier ?? 1}`;
}

/** Short interval name for tabs: "Monthly", "Quarterly", "Annual", "Weekly", or "Every 2 weeks". */
export function intervalName(interval: BillingInterval): string {
  const { unit, count } = interval;
  if (count === 1) return { week: 'Weekly', month: 'Monthly', year: 'Annual' }[unit];
  if (unit === 'month' && count === 3) return 'Quarterly';
  if (unit === 'month' && count === 6) return 'Every 6 months';
  return `Every ${count} ${unit}s`;
}

/** Title and detail lines for a purchase option card. */
export function purchaseOptionText(option: PurchaseOption, variantPrice: Money): { title: string; detail: string; price: Money } {
  const price = subscriptionUnitPrice(variantPrice, option);
  if (option.type === 'one-time') return { title: 'One-time purchase', detail: formatMoney(price), price };
  const title = option.discountPercent ? `Subscribe and save ${option.discountPercent}%` : 'Subscribe';
  const trial = formatTrial(option.trialDays);
  const detail = [`Delivered ${option.interval.count === 1 ? `every ${option.interval.unit}` : formatInterval(option.interval)}`, formatRecurring(price, option.interval), trial && `${trial}, then billed`].filter(Boolean).join(' · ');
  return { title, detail, price };
}

/** Option display, defaulting to `select` for 12 or more values. */
export const optionDisplay = (option: ProductOption) => option.display ?? (option.values.length >= 12 ? 'select' : 'buttons');

/** "4 colours", "3 sizes": a short summary of the option with the most values. */
export function optionSummary(product: Product): string | undefined {
  const option = [...product.options].sort((a, b) => b.values.length - a.values.length)[0];
  if (!option || option.values.length < 2) return undefined;
  const noun = option.name.toLowerCase();
  const plural = noun.endsWith('s') ? noun : noun.endsWith('y') ? `${noun.slice(0, -1)}ies` : `${noun}s`;
  return `${option.values.length} ${plural}`;
}

/** "18.4 MB": decimal (SI) units, one decimal place from MB up, whole KB below. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1000) return `${Math.round(bytes)} B`;
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} KB`;
  const units = ['MB', 'GB', 'TB'];
  let value = bytes / 1_000_000;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}
