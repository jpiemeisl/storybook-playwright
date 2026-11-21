/*
 * Account area logic. Pure: anything time-dependent takes `now` (ISO 8601) as a parameter; dates are
 * formatted deterministically in UTC ("Apr 1, 2026").
 */
import type { Money } from '../../content-types/money';
import { formatMoney } from '../../utils/formatMoney';
import type { CustomerSubscription, Order, OrderStatus } from '../types/order';
import type { Invoice, LibraryItem, SavedAddress, SubscriptionPlanOption, WishlistItem } from '../types/account';
import type { BillingInterval } from '../types/product';
import type { SummaryRow } from './cartSummary';
import { subtract } from './money';
import { addInterval, formatCommerceDate, formatRecurring } from './pricing';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface StatusInfo {
  label: string;
  tone: StatusTone;
  description: string;
}

// ---------------------------------------------------------------------------------------------- orders

const orderStatus: Record<OrderStatus, StatusInfo> = {
  processing: { label: 'Processing', tone: 'info', description: 'We’ve received your order and are getting it ready.' },
  shipped: { label: 'Shipped', tone: 'info', description: 'Your order is on its way.' },
  delivered: { label: 'Delivered', tone: 'success', description: 'Your order was delivered.' },
  cancelled: { label: 'Cancelled', tone: 'neutral', description: 'This order was cancelled. You have not been charged.' },
  refunded: { label: 'Refunded', tone: 'neutral', description: 'This order was refunded to your original payment method.' },
};

/** The plain label for a status, e.g. for filters. */
export const orderStatusLabel = (status: OrderStatus) => orderStatus[status].label;

/** Label, tone and a sentence for an order's status. Digital-only orders read "Ready" instead of shipping words. */
export function getOrderStatusInfo(order: Pick<Order, 'status' | 'lines'>): StatusInfo {
  const ships = order.lines.some((l) => l.snapshot.requiresShipping);
  if (!ships && (order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered')) {
    return { label: 'Complete', tone: 'success', description: 'Your downloads and subscriptions are ready.' };
  }
  return orderStatus[order.status];
}

export interface TimelineStep {
  id: string;
  label: string;
  /** ISO 8601 date-time when known. */
  at?: string;
  state: 'done' | 'current' | 'upcoming';
}

/**
 * The order's milestones, in order, from its status and tracking events:
 *   placed → (subscription started) → (downloads ready) → preparing → shipped → delivered
 * Digital-only orders have no shipping milestones. Cancelled and refunded orders end with that step as
 * current; shipping milestones before it appear only if tracking shows they happened.
 */
export function buildOrderTimeline(order: Pick<Order, 'status' | 'lines' | 'placedAt' | 'tracking' | 'downloads'>): TimelineStep[] {
  const ships = order.lines.some((l) => l.snapshot.requiresShipping);
  const subscribes = order.lines.some((l) => l.purchaseOption.type === 'subscription');
  const events = order.tracking?.events ?? [];
  const shippedAt = events[0]?.at;
  const deliveredAt = events.find((e) => /deliver/i.test(e.label))?.at;
  const steps: TimelineStep[] = [{ id: 'placed', label: 'Order placed', at: order.placedAt, state: 'done' }];
  if (subscribes) steps.push({ id: 'subscription', label: 'Subscription started', at: order.placedAt, state: 'done' });
  if (order.downloads?.length) steps.push({ id: 'downloads', label: 'Downloads ready', at: order.placedAt, state: 'done' });

  if (order.status === 'cancelled' || order.status === 'refunded') {
    if (ships && shippedAt) steps.push({ id: 'shipped', label: 'Shipped', at: shippedAt, state: 'done' });
    if (ships && deliveredAt) steps.push({ id: 'delivered', label: 'Delivered', at: deliveredAt, state: 'done' });
    steps.push({ id: order.status, label: order.status === 'cancelled' ? 'Cancelled' : 'Refunded', state: 'current' });
    return steps;
  }
  if (!ships) return steps;

  const reached = { processing: 0, shipped: 1, delivered: 2 }[order.status];
  const shipping: Omit<TimelineStep, 'state'>[] = [
    { id: 'preparing', label: 'Preparing your order' },
    { id: 'shipped', label: 'Shipped', ...(shippedAt ? { at: shippedAt } : {}) },
    { id: 'delivered', label: 'Delivered', ...(deliveredAt ? { at: deliveredAt } : {}) },
  ];
  shipping.forEach((step, i) => {
    const state = order.status === 'delivered' ? 'done' : i < reached ? 'done' : i === reached ? 'current' : 'upcoming';
    steps.push({ ...step, state });
  });
  return steps;
}

export interface OrderSections {
  shipping: boolean;
  tracking: boolean;
  downloads: boolean;
  subscriptions: boolean;
  billingAddress: boolean;
}

/** Which detail sections apply to an order. */
export function getOrderSections(order: Order): OrderSections {
  return {
    shipping: order.lines.some((l) => l.snapshot.requiresShipping) && !!order.shippingAddress,
    tracking: !!order.tracking,
    downloads: !!order.downloads?.length,
    subscriptions: !!order.recurring?.length || order.lines.some((l) => l.purchaseOption.type === 'subscription'),
    billingAddress: !!order.billingAddress,
  };
}

// ------------------------------------------------------------------------------------- subscriptions

/** Whole days from the date of `now` to the date of `iso` (UTC calendar days; negative when past). */
export function daysUntil(iso: string, now: string): number {
  const day = (value: string) => Date.UTC(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10)));
  return Math.round((day(iso) - day(now)) / 86_400_000);
}

const inDays = (days: number) => (days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`);

/**
 * Label, tone and a sentence for a subscription:
 *   "Renews on Apr 1, 2026", "Trial ends in 6 days", "Paused until Jan 5, 2027", "Paused",
 *   "Payment failed: update your payment method", "Cancels on Dec 5, 2026", "Cancelled on Oct 2, 2026".
 */
export function getSubscriptionStatusInfo(sub: CustomerSubscription, now: string): StatusInfo {
  const date = (iso?: string) => (iso ? formatCommerceDate(iso) : '');
  if (sub.status === 'cancelled') return { label: 'Cancelled', tone: 'neutral', description: sub.cancelledAt ? `Cancelled on ${date(sub.cancelledAt)}` : 'Cancelled' };
  if (sub.cancelAtPeriodEnd) {
    const end = sub.currentPeriodEnd ?? sub.trialEndsAt ?? sub.nextBillingAt;
    return { label: 'Cancelling', tone: 'warning', description: end ? `Cancels on ${date(end)}` : 'Cancels at the end of this period' };
  }
  switch (sub.status) {
    case 'trialing':
      return { label: 'Free trial', tone: 'info', description: sub.trialEndsAt ? `Trial ends ${inDays(daysUntil(sub.trialEndsAt, now))}` : 'Free trial' };
    case 'active':
      return { label: 'Active', tone: 'success', description: sub.nextBillingAt ? `Renews on ${date(sub.nextBillingAt)}` : 'Active' };
    case 'past-due':
      return { label: 'Payment failed', tone: 'danger', description: 'Payment failed: update your payment method' };
    case 'paused':
      return { label: 'Paused', tone: 'warning', description: sub.pausedUntil ? `Paused until ${date(sub.pausedUntil)}` : 'Paused until you resume it' };
  }
}

export type SubscriptionAction = 'pause' | 'resume' | 'change-plan' | 'cancel' | 'undo-cancel' | 'update-payment' | 'reactivate';

/** Every action, in display order. */
export const SUBSCRIPTION_ACTIONS: readonly SubscriptionAction[] = ['pause', 'resume', 'change-plan', 'cancel', 'undo-cancel', 'update-payment', 'reactivate'];

/**
 * Actions available for a subscription:
 *   pause           active or trialing, not cancelling
 *   resume          paused
 *   change-plan     active or trialing, not cancelling, with at least one other plan
 *   cancel          not cancelled and not already cancelling
 *   undo-cancel     cancelling (cancelAtPeriodEnd)
 *   update-payment  any status except cancelled (the primary action when past due)
 *   reactivate      cancelled
 */
export function getSubscriptionActions(sub: CustomerSubscription): SubscriptionAction[] {
  const live = sub.status === 'active' || sub.status === 'trialing';
  const cancelling = !!sub.cancelAtPeriodEnd;
  const rules: Record<SubscriptionAction, boolean> = {
    pause: live && !cancelling,
    resume: sub.status === 'paused',
    'change-plan': live && !cancelling && (sub.availablePlans?.filter((p) => !p.current).length ?? 0) > 0,
    cancel: sub.status !== 'cancelled' && !cancelling,
    'undo-cancel': cancelling,
    'update-payment': sub.status !== 'cancelled',
    reactivate: sub.status === 'cancelled',
  };
  return SUBSCRIPTION_ACTIONS.filter((a) => rules[a]);
}

export type PauseMonths = 1 | 2 | 3;

/** ISO date `months` months after `now`, clamping month ends (Jan 31 + 1 month → Feb 28, or 29 in leap years). */
export function computePauseResumeDate(now: string, months: PauseMonths): string {
  return addInterval(now, { unit: 'month', count: months });
}

/** Cycles per year as a fraction [numerator, denominator], for exact price comparisons. */
const cyclesPerYear = (interval: BillingInterval): [number, number] => [interval.unit === 'week' ? 52 : interval.unit === 'month' ? 12 : 1, interval.count];

export interface PlanChangeSummary {
  direction: 'upgrade' | 'downgrade' | 'switch';
  /** Next plan's price per cycle minus the current one's (may be negative). */
  priceDifference: Money;
  /** e.g. "Your plan changes to Annual ($192.00 / year) on Apr 1, 2026. Nothing is charged today." */
  effectiveText: string;
}

/**
 * Compares two plans by their yearly cost (exact integer cross-multiplication): more is an upgrade,
 * less a downgrade, equal a switch. The change takes effect at the next billing date: no proration.
 * Throws CurrencyMismatchError when the plans use different currencies.
 */
export function getPlanChangeSummary(current: SubscriptionPlanOption, next: SubscriptionPlanOption, effectiveAt?: string): PlanChangeSummary {
  const priceDifference = subtract(next.price, current.price);
  const [cn, cd] = cyclesPerYear(current.interval);
  const [nn, nd] = cyclesPerYear(next.interval);
  const a = BigInt(next.price.amount) * BigInt(nn) * BigInt(cd);
  const b = BigInt(current.price.amount) * BigInt(cn) * BigInt(nd);
  const direction = a > b ? 'upgrade' : a < b ? 'downgrade' : 'switch';
  const when = effectiveAt ? `on ${formatCommerceDate(effectiveAt)}` : 'at your next billing date';
  return { direction, priceDifference, effectiveText: `Your plan changes to ${next.name} (${formatRecurring(next.price, next.interval)}) ${when}. Nothing is charged today.` };
}

// -------------------------------------------------------------------------------- invoices, addresses

/** Invoices grouped by year (newest year first, newest invoice first within a year). */
export function groupInvoicesByYear(invoices: readonly Invoice[]): { year: string; invoices: Invoice[] }[] {
  const sorted = [...invoices].sort((x, y) => (x.issuedAt < y.issuedAt ? 1 : x.issuedAt > y.issuedAt ? -1 : 0));
  const groups = new Map<string, Invoice[]>();
  for (const invoice of sorted) {
    const year = invoice.issuedAt.slice(0, 4);
    groups.set(year, [...(groups.get(year) ?? []), invoice]);
  }
  return [...groups].map(([year, list]) => ({ year, invoices: list }));
}

export type AddressKind = 'shipping' | 'billing';
const flag = (kind: AddressKind): 'isDefaultShipping' | 'isDefaultBilling' => (kind === 'shipping' ? 'isDefaultShipping' : 'isDefaultBilling');

/** Most addresses an address book holds. */
export const MAX_ADDRESSES = 10;

/** The default address of a kind, if one is set. */
export const getDefaultAddress = (addresses: readonly SavedAddress[], kind: AddressKind) => addresses.find((a) => a[flag(kind)]);

/** A new array where `id` is the only default of `kind`. Unknown ids return the input unchanged. */
export function setDefaultAddress(addresses: readonly SavedAddress[], id: string, kind: AddressKind): SavedAddress[] {
  if (!addresses.some((a) => a.id === id)) return [...addresses];
  const key = flag(kind);
  return addresses.map(({ [key]: _old, ...rest }) => (rest.id === id ? { ...rest, [key]: true } : rest) as SavedAddress);
}

/**
 * A new array without `id`. If it was a default, the first remaining address becomes the default of
 * that kind, so a non-empty book always keeps its defaults. Unknown ids return the input unchanged.
 */
export function removeAddress(addresses: readonly SavedAddress[], id: string): SavedAddress[] {
  const removed = addresses.find((a) => a.id === id);
  if (!removed) return [...addresses];
  let rest = addresses.filter((a) => a.id !== id);
  for (const kind of ['shipping', 'billing'] as const) {
    if (removed[flag(kind)] && rest.length > 0 && !getDefaultAddress(rest, kind)) rest = setDefaultAddress(rest, rest[0]!.id, kind);
  }
  return rest;
}

// ------------------------------------------------------------------------------------------ dashboard

export interface AccountData {
  orders: readonly Order[];
  subscriptions: readonly CustomerSubscription[];
  invoices: readonly Invoice[];
  downloads: readonly LibraryItem[];
  addresses: readonly SavedAddress[];
  wishlist: readonly WishlistItem[];
}

/** A brand-new account: nothing ordered, subscribed, saved or downloaded. */
export const isAccountEmpty = (data: AccountData) =>
  [data.orders, data.subscriptions, data.invoices, data.downloads, data.addresses, data.wishlist].every((list) => list.length === 0);

export interface AttentionItem {
  id: string;
  kind: 'subscription-past-due' | 'invoice-failed' | 'download-unavailable';
  message: string;
  /** Where to fix it, relative to the account base path. */
  href: string;
}

/** "Needs attention": past-due subscriptions, failed invoices and unavailable downloads, in that order. */
export function getAttentionItems(data: Pick<AccountData, 'subscriptions' | 'invoices' | 'downloads'>, base = '/account'): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const sub of data.subscriptions) {
    if (sub.status === 'past-due') items.push({ id: `sub-${sub.id}`, kind: 'subscription-past-due', message: `${sub.productTitle}: payment failed. Update your payment method to keep it.`, href: `${base}/subscriptions/${sub.id}` });
  }
  for (const invoice of data.invoices) {
    if (invoice.status === 'failed') items.push({ id: `inv-${invoice.id}`, kind: 'invoice-failed', message: `Invoice ${invoice.number} (${formatMoney(invoice.amount)}) could not be paid.`, href: invoice.subscriptionId ? `${base}/subscriptions/${invoice.subscriptionId}` : `${base}/orders` });
  }
  for (const item of data.downloads) {
    const unavailable = item.files.filter((f) => !f.available);
    if (unavailable.length) items.push({ id: `dl-${item.productId}-${item.orderId}`, kind: 'download-unavailable', message: `${item.productTitle}: ${unavailable.length === 1 ? 'a download is' : `${unavailable.length} downloads are`} no longer available.`, href: `${base}/downloads` });
  }
  return items;
}

// ------------------------------------------------------------------------------------- order history

export interface OrderFilter {
  status?: OrderStatus;
  /** "2026". */
  year?: string;
}

/** Orders matching a status and/or year, order kept. */
export const filterOrders = (orders: readonly Order[], filter: OrderFilter) =>
  orders.filter((o) => (!filter.status || o.status === filter.status) && (!filter.year || o.placedAt.startsWith(filter.year)));

/** Years that have orders, newest first. */
export const orderYears = (orders: readonly Order[]) => [...new Set(orders.map((o) => o.placedAt.slice(0, 4)))].sort().reverse();

/** "3 items: Waxed canvas tote, House coffee beans and 1 more". */
export function orderItemsSummary(order: Pick<Order, 'lines'>): string {
  const count = order.lines.reduce((n, l) => n + l.quantity, 0);
  const titles = order.lines.map((l) => l.snapshot.title);
  const shown = titles.slice(0, 2).join(', ');
  const more = titles.length > 2 ? ` and ${titles.length - 2} more` : '';
  return `${count} ${count === 1 ? 'item' : 'items'}: ${shown}${more}`;
}

/** Summary rows for a placed order (same shape as the cart's, so SummaryRows renders both); ends with "Billed today". */
export function orderSummaryRows(order: Pick<Order, 'totals' | 'lines'>): SummaryRow[] {
  const { totals } = order;
  const rows: SummaryRow[] = [{ key: 'subtotal', label: 'Subtotal', amount: totals.subtotal }];
  if (totals.discount.amount > 0) rows.push({ key: 'discount', label: 'Discount', code: 'order', amount: totals.discount });
  if (order.lines.some((l) => l.snapshot.requiresShipping)) rows.push(totals.shipping.amount === 0 ? { key: 'shipping', label: 'Shipping', text: 'Free' } : { key: 'shipping', label: 'Shipping', amount: totals.shipping });
  if (totals.dueToday && totals.dueToday.amount !== totals.total.amount) rows.push({ key: 'trial', label: 'Free trial (billed later)', amount: subtract(totals.total, totals.dueToday) });
  rows.push({ key: 'tax', label: 'Tax', amount: totals.tax, note: '' });
  rows.push({ key: 'dueToday', label: 'Billed today', amount: totals.dueToday ?? totals.total });
  return rows;
}
