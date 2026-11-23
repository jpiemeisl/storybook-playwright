import { useId } from 'react';
import type { Money } from '../../../content-types/money';
import { Icon } from '../../../components/Icon';
import { formatMoney } from '../../../utils/formatMoney';
import type { CartTotals } from '../../logic/cart';
import styles from './FreeShippingProgress.module.css';

/** Props for FreeShippingProgress; pass the matching fields of CartTotals. */
export interface FreeShippingProgressProps {
  /** `totals.freeShippingProgress`. */
  progress: CartTotals['freeShippingProgress'];
  /** `totals.subtotal`, for the bar. */
  subtotal: Money;
  /** `totals.flags.hasShippable`. Nothing renders for carts that ship nothing. */
  hasShippable: boolean;
}

/**
 * "You're $23.50 away from free shipping" / "You've unlocked free shipping", always as text, with a
 * native <progress> labelled by that text (explicit aria-value* because <progress> does not expose
 * them everywhere). Hidden without shippable lines or a threshold.
 */
export function FreeShippingProgress({ progress, subtotal, hasShippable }: FreeShippingProgressProps) {
  const textId = useId();
  const { threshold, remaining, reached } = progress;
  if (!hasShippable || threshold.amount <= 0) return null;
  const value = Math.min(subtotal.amount, threshold.amount);
  return (
    <div className={styles.root} data-reached={reached || undefined}>
      <p id={textId} className={styles.text}>
        <Icon name={reached ? 'check-circle' : 'truck'} size="sm" />
        {reached ? 'You’ve unlocked free shipping' : `You’re ${formatMoney(remaining)} away from free shipping`}
      </p>
      <progress className={styles.progress} max={threshold.amount} value={value} aria-labelledby={textId} aria-valuemin={0} aria-valuemax={threshold.amount} aria-valuenow={value} aria-valuetext={`${formatMoney(subtotal)} of ${formatMoney(threshold)}`} />
    </div>
  );
}
