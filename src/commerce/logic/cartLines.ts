/*
 * Per-line display notes and stock problems for carts. Pure: the catalogue is passed in.
 */
import type { Money } from '../../content-types/money';
import { formatMoney } from '../../utils/formatMoney';
import type { Cart, CartLine } from '../types/cart';
import type { BillingInterval, Product } from '../types/product';
import { multiply } from './money';
import { formatCommerceDate, formatInterval, formatRecurring, formatTrial, subscriptionUnitPrice } from './pricing';

/** Kinds of display note getCartLineNotes can attach to a cart line. */
export type CartLineNoteKind = 'renewal' | 'trial' | 'download' | 'ships-separately' | 'savings';

/** One short display note under a cart line, such as "Renews every month" or "Instant download". */
export interface CartLineNote {
  kind: CartLineNoteKind;
  text: string;
}

/** Optional catalog context for getCartLineNotes; notes that need missing context are skipped. */
export interface CartLineNoteContext {
  /** The line's product, for digital delivery and stock dates. Notes that need it are skipped without it. */
  product?: Product;
  /** The cart has other shippable lines, so a backordered or pre-ordered line ships separately. */
  otherShippableLines?: boolean;
}

/** "every month", "every 3 months". */
const every = (interval: BillingInterval) => (interval.count === 1 ? `every ${interval.unit}` : formatInterval(interval));

/**
 * Display notes for a cart line, in a stable order:
 *   trial             "Free for 14 days, then $6.00 / month" (replaces the renewal note)
 *   renewal           "Renews every month" / "Renews every 3 months"
 *   savings           "Subscribe and save 15%" (subscription discount on a physical product)
 *   download          "Instant download" (digital)
 *   ships-separately  backorder or pre-order next to other shippable lines, with the date when known
 */
export function getCartLineNotes(line: CartLine, ctx: CartLineNoteContext = {}): CartLineNote[] {
  const notes: CartLineNote[] = [];
  const option = line.purchaseOption;
  if (option.type === 'subscription') {
    const perCycle = multiply(subscriptionUnitPrice(line.snapshot.unitPrice, option), line.quantity);
    if (option.trialDays) notes.push({ kind: 'trial', text: `${formatTrial(option.trialDays)}, then ${formatRecurring(perCycle, option.interval)}` });
    else notes.push({ kind: 'renewal', text: `Renews ${every(option.interval)}` });
    if (option.discountPercent && line.snapshot.kind === 'physical') notes.push({ kind: 'savings', text: `Subscribe and save ${option.discountPercent}%` });
  }
  if (line.snapshot.kind === 'digital') {
    notes.push({ kind: 'download', text: ctx.product?.digital?.instant === false ? 'Download link sent after purchase' : 'Instant download' });
  }
  if (line.snapshot.requiresShipping && ctx.otherShippableLines) {
    const stock = ctx.product?.variants.find((v) => v.id === line.variantId)?.stock;
    if (stock && (stock.status === 'backorder' || stock.status === 'preorder')) {
      notes.push({ kind: 'ships-separately', text: stock.availableOn ? `Ships separately from ${formatCommerceDate(stock.availableOn)}` : 'Ships separately' });
    }
  }
  return notes;
}

/** getCartLineNotes for every line, keyed by line id, with products looked up and "other shippable lines" worked out. */
export function getCartNotes(cart: Cart, products: readonly Product[] = []): Record<string, CartLineNote[]> {
  const byId = new Map(products.map((p) => [p.id, p]));
  const shippable = cart.lines.filter((l) => l.snapshot.requiresShipping).length;
  return Object.fromEntries(cart.lines.map((line) => [line.id, getCartLineNotes(line, { product: byId.get(line.productId), otherShippableLines: shippable > 1 })]));
}

/** Kinds of stock problem getCartIssues reports for a cart line. */
export type CartIssueKind = 'out-of-stock' | 'quantity-above-stock' | 'unavailable';

/** A stock problem on one cart line, with a customer-facing message; returned by getCartIssues. */
export interface CartIssue {
  lineId: string;
  kind: CartIssueKind;
  /** Product title from the line snapshot. */
  title: string;
  /** Units that can be bought (quantity-above-stock). */
  available?: number;
  /** Customer-facing message, e.g. "Only 2 left. Reduce the quantity to continue." */
  message: string;
  /** Blocks checkout until fixed. Every current kind blocks. */
  blocking: boolean;
}

/**
 * Stock problems per line, checked against the current catalogue:
 *   unavailable           the product or variant no longer exists
 *   out-of-stock          the variant is out of stock (backorder and pre-order can still be bought)
 *   quantity-above-stock  in or low stock with a known quantity below the line quantity
 */
export function getCartIssues(cart: Cart, products: readonly Product[]): CartIssue[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const issues: CartIssue[] = [];
  for (const line of cart.lines) {
    const title = line.snapshot.title;
    const variant = byId.get(line.productId)?.variants.find((v) => v.id === line.variantId);
    if (!variant) {
      issues.push({ lineId: line.id, kind: 'unavailable', title, message: 'No longer available. Remove it to continue.', blocking: true });
      continue;
    }
    const { status, quantity } = variant.stock;
    if (status === 'out-of-stock') {
      issues.push({ lineId: line.id, kind: 'out-of-stock', title, message: 'Out of stock. Remove it to continue.', blocking: true });
    } else if ((status === 'in-stock' || status === 'low-stock') && quantity !== undefined && line.quantity > quantity) {
      issues.push({ lineId: line.id, kind: 'quantity-above-stock', title, available: quantity, message: `Only ${quantity} left. Reduce the quantity to continue.`, blocking: true });
    }
  }
  return issues;
}

/** True when any issue blocks checkout. */
export const hasBlockingIssues = (issues: readonly CartIssue[]) => issues.some((i) => i.blocking);

/** "$9.00 every month starting Dec 5, 2026", for "Then billed" lists. */
export function recurringText(amount: Money, interval: BillingInterval, startsAt?: string): string {
  return `${formatMoney(amount)} ${every(interval)}${startsAt ? ` starting ${formatCommerceDate(startsAt)}` : ''}`;
}
