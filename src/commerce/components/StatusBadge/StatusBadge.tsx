import { Badge, type BadgeTone } from '../../../components/Badge';
import { Icon, type IconName } from '../../../components/Icon';
import { getOrderStatusInfo, getSubscriptionStatusInfo, type StatusTone } from '../../logic/account';
import type { CustomerSubscription, Order } from '../../types/order';
import styles from './StatusBadge.module.css';

const tones: Record<StatusTone, { badge: BadgeTone; icon: IconName }> = {
  neutral: { badge: 'neutral', icon: 'info' },
  info: { badge: 'accent', icon: 'clock' },
  success: { badge: 'success', icon: 'check-circle' },
  warning: { badge: 'neutral', icon: 'alert-triangle' },
  danger: { badge: 'danger', icon: 'alert-circle' },
};

export interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
  /** Overrides the tone's icon. */
  icon?: IconName;
}

/** A status as text plus an icon (never colour alone), on the core Badge. */
export function StatusBadge({ label, tone, icon }: StatusBadgeProps) {
  const t = tones[tone];
  return (
    <Badge tone={t.badge} size="sm" className={[styles.badge, tone === 'warning' && styles.warning].filter(Boolean).join(' ')}>
      <Icon name={icon ?? t.icon} size="sm" />
      {label}
    </Badge>
  );
}

const orderIcons: Record<Order['status'], IconName> = { processing: 'clock', shipped: 'truck', delivered: 'check-circle', cancelled: 'close', refunded: 'refresh' };

/** An order's status (getOrderStatusInfo). */
export function OrderStatusBadge({ order }: { order: Pick<Order, 'status' | 'lines'> }) {
  const info = getOrderStatusInfo(order);
  return <StatusBadge label={info.label} tone={info.tone} icon={info.label === 'Complete' ? 'check-circle' : orderIcons[order.status]} />;
}

const subIcons: Record<CustomerSubscription['status'], IconName> = { active: 'repeat', trialing: 'calendar', 'past-due': 'alert-circle', paused: 'pause', cancelled: 'close' };

/** A subscription's status (getSubscriptionStatusInfo; the label does not depend on `now`). */
export function SubscriptionStatusBadge({ subscription, now }: { subscription: CustomerSubscription; now: string }) {
  const info = getSubscriptionStatusInfo(subscription, now);
  return <StatusBadge label={info.label} tone={info.tone} icon={subscription.cancelAtPeriodEnd ? 'clock' : subIcons[subscription.status]} />;
}
