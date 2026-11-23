import { Icon, type IconName } from '../../../components/Icon';
import { formatMoney } from '../../../utils/formatMoney';
import { FREE_SHIPPING_THRESHOLD } from '../../logic/cart';
import { formatBytes } from '../../logic/options';
import { formatInterval } from '../../logic/pricing';
import type { Product, PurchaseOption } from '../../types/product';
import styles from './DeliveryInfo.module.css';

/** Store policy text (demo store). Hosts with other policies render their own list. */
export const DELIVERY_COPY = { dispatch: 'Ships in 1-2 business days', returns: 'Free returns within 30 days' };

/** Props for DeliveryInfo. */
export interface DeliveryInfoProps {
  product: Product;
  /** The selected purchase option (for the billing line of subscriptions and subscribe-and-save). */
  purchaseOption?: PurchaseOption;
}

/** Delivery lines for the product kind. Text comes from product data and constants, never from a clock. */
export function deliveryLines(product: Product, purchaseOption?: PurchaseOption): { icon: IconName; text: string }[] {
  const lines: { icon: IconName; text: string }[] = [];
  if (product.kind === 'physical') {
    lines.push({ icon: 'truck', text: DELIVERY_COPY.dispatch });
    lines.push({ icon: 'tag', text: `Free shipping on orders over ${formatMoney(FREE_SHIPPING_THRESHOLD, { trimWholeAmounts: true })}` });
    lines.push({ icon: 'refresh', text: DELIVERY_COPY.returns });
  }
  if (product.kind === 'digital' && product.digital) {
    const { files, accessDays, instant } = product.digital;
    const size = formatBytes(files.reduce((sum, f) => sum + f.sizeBytes, 0));
    lines.push({ icon: 'download', text: instant ? 'Instant download after purchase' : 'Download link emailed after purchase' });
    lines.push({ icon: 'tag', text: `${files.length} ${files.length === 1 ? 'file' : 'files'}, ${size}` });
    if (accessDays) lines.push({ icon: 'clock', text: `Downloads available for ${accessDays} days` });
  }
  if (purchaseOption?.type === 'subscription') {
    const every = purchaseOption.interval.count === 1 ? `every ${purchaseOption.interval.unit}` : formatInterval(purchaseOption.interval);
    const terms = product.subscription;
    const cancel = terms?.minimumTermMonths ? `Minimum term ${terms.minimumTermMonths} months.` : terms?.cancelAnytime === false ? '' : 'Cancel anytime.';
    lines.push({ icon: 'repeat', text: [`Billed ${every}.`, cancel].filter(Boolean).join(' ') });
  }
  return lines;
}

/** Lists delivery and billing facts for a product as icon lines: dispatch, free shipping and returns for physical products, file count, size and access period for digital ones, and the billing interval and cancellation terms for a subscription purchase option. Renders nothing when no line applies. */
export function DeliveryInfo({ product, purchaseOption }: DeliveryInfoProps) {
  const lines = deliveryLines(product, purchaseOption);
  if (lines.length === 0) return null;
  return (
    <ul className={styles.list}>
      {lines.map((line) => (
        <li key={line.text} className={styles.item}>
          <Icon name={line.icon} size="sm" className={styles.icon} />
          {line.text}
        </li>
      ))}
    </ul>
  );
}

/** "Try free for 14 days. You won't be charged today." Renders nothing without a trial. */
export function TrialBanner({ trialDays }: { trialDays?: number }) {
  if (!trialDays) return null;
  return (
    <p className={styles.trial}>
      <Icon name="calendar" size="sm" className={styles.icon} />
      <span>
        <strong>Try free for {trialDays} days.</strong> You won’t be charged today.
      </span>
    </p>
  );
}
