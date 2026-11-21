/*
 * The rows CartSummary and OrderSummary show, derived from CartTotals. Pure; components render these
 * and do no arithmetic. The rows always add up to "Due today".
 */
import type { Money } from '../../content-types/money';
import { formatMoney } from '../../utils/formatMoney';
import type { CartTotals } from './cart';
import { recurringText } from './cartLines';
import { subtract } from './money';
import { formatCommerceDate } from './pricing';

export type SummaryRow =
  | { key: 'subtotal'; label: string; amount: Money }
  /** One per applied promo. `amount` is the positive discount; show it as a deduction. */
  | { key: 'discount'; label: string; code: string; amount: Money }
  /** Only when the cart has shippable lines. `text` replaces the amount ("Calculated at checkout", "Free"). */
  | { key: 'shipping'; label: string; amount?: Money; text?: string; note?: string }
  /** Trial lines are in the subtotal but not charged today. Positive amount, shown as a deduction. */
  | { key: 'trial'; label: string; amount: Money }
  | { key: 'tax'; label: string; amount: Money; note: string }
  | { key: 'dueToday'; label: string; amount: Money };

export interface SummaryOptions {
  /** False before the customer has given an address: shipping is labelled as an estimate, "Calculated at checkout from your address". Default true. */
  shippingKnown?: boolean;
}

/** Subtotal, discounts, shipping (shippable carts only), trial deduction, estimated tax and "Due today". */
export function summaryRows(totals: CartTotals, options: SummaryOptions = {}): SummaryRow[] {
  const rows: SummaryRow[] = [{ key: 'subtotal', label: 'Subtotal', amount: totals.subtotal }];
  for (const promo of totals.appliedPromos) {
    if (promo.kind !== 'free-shipping') rows.push({ key: 'discount', label: `Discount (${promo.code})`, code: promo.code, amount: promo.amount });
  }
  if (totals.flags.hasShippable) {
    const freeCode = totals.appliedPromos.find((p) => p.kind === 'free-shipping');
    if (totals.shipping.amount === 0 && (freeCode || totals.freeShippingProgress.reached || options.shippingKnown !== false)) {
      const note = freeCode ? `${freeCode.code} applied` : totals.freeShippingProgress.reached ? `Orders over ${formatMoney(totals.freeShippingProgress.threshold)} ship free` : undefined;
      rows.push({ key: 'shipping', label: freeCode ? `Shipping (${freeCode.code})` : 'Shipping', text: 'Free', ...(note ? { note } : {}) });
    } else if (options.shippingKnown === false) {
      // Before an address: the estimate is in the total, so show it, labelled as an estimate.
      rows.push({ key: 'shipping', label: 'Estimated shipping', ...(totals.shipping.amount > 0 ? { amount: totals.shipping } : { text: 'Calculated at checkout' }), note: `${totals.shippingMethod ? `${totals.shippingMethod.label}. ` : ''}Calculated at checkout from your address.` });
    } else {
      rows.push({ key: 'shipping', label: 'Shipping', amount: totals.shipping, ...(totals.shippingMethod ? { note: totals.shippingMethod.label } : {}) });
    }
  }
  if (totals.dueToday.amount !== totals.total.amount) rows.push({ key: 'trial', label: 'Free trial (billed later)', amount: subtract(totals.total, totals.dueToday) });
  rows.push({ key: 'tax', label: 'Estimated tax', amount: totals.tax, note: 'Final tax is calculated when you pay.' });
  rows.push({ key: 'dueToday', label: 'Due today', amount: totals.dueToday });
  return rows;
}

export interface ThenBilledItem {
  /** "$9.00 every month starting Apr 21, 2026". */
  text: string;
  /** "After your 14-day free trial. Cancel before Apr 4, 2026 to pay nothing." */
  note?: string;
}

/** The "Then billed" list: one item per recurring charge group, with trial notes. */
export function thenBilled(totals: Pick<CartTotals, 'recurring'>): ThenBilledItem[] {
  return totals.recurring.map((charge) => ({
    text: recurringText(charge.amount, charge.interval, charge.startsAt),
    ...(charge.trialDays && charge.startsAt ? { note: `After your ${charge.trialDays}-day free trial. Cancel before ${formatCommerceDate(charge.startsAt)} to pay nothing.` } : {}),
  }));
}
