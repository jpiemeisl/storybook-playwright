import { Icon, type IconName } from '../../../components/Icon';
import { formatIsoDate } from '../../../utils/formatDate';
import type { StockInfo } from '../../types/product';
import styles from './StockBadge.module.css';

/** Props for StockBadge. */
export interface StockBadgeProps {
  /** Stock status, plus the quantity (low stock) and availability date (backorder, pre-order) when known. */
  stock: StockInfo;
  size?: 'sm' | 'md';
}

type Tone = 'success' | 'warning' | 'danger' | 'info';

/** Text for a stock state; dates are formatted in UTC so output never depends on the viewer's clock or zone. */
export function stockLabel(stock: StockInfo): { text: string; icon: IconName; tone: Tone } {
  const date = stock.availableOn ? formatIsoDate(stock.availableOn) : undefined;
  switch (stock.status) {
    case 'in-stock':
      return { text: 'In stock', icon: 'check-circle', tone: 'success' };
    case 'low-stock':
      return { text: stock.quantity !== undefined ? `Only ${stock.quantity} left` : 'Low stock', icon: 'alert-triangle', tone: 'warning' };
    case 'out-of-stock':
      return { text: 'Sold out', icon: 'alert-circle', tone: 'danger' };
    case 'backorder':
      return { text: date ? `Back in stock on ${date}` : 'On backorder', icon: 'clock', tone: 'info' };
    case 'preorder':
      return { text: date ? `Pre-order: ships ${date}` : 'Pre-order', icon: 'calendar', tone: 'info' };
  }
}

/** Stock state as icon plus text; the colour only reinforces the text. */
export function StockBadge({ stock, size = 'md' }: StockBadgeProps) {
  const { text, icon, tone } = stockLabel(stock);
  return (
    <span className={[styles.badge, styles[tone], styles[size]].join(' ')}>
      <Icon name={icon} size="sm" className={styles.icon} />
      {text}
    </span>
  );
}
