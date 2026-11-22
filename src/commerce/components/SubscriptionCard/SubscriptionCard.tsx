import type { ReactNode } from 'react';
import { Button, ButtonLink } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import { getSubscriptionStatusInfo } from '../../logic/account';
import { formatCommerceDate } from '../../logic/pricing';
import type { CustomerSubscription } from '../../types/order';
import { Price } from '../Price';
import { SubscriptionStatusBadge } from '../StatusBadge';
import styles from './SubscriptionCard.module.css';

export interface SubscriptionCardProps {
  subscription: CustomerSubscription;
  /** ISO 8601 "now" for trial countdowns. */
  now: string;
  /** "Manage" link to the subscription page. Omit on the subscription page itself. */
  href?: string;
  /** `compact` for the dashboard: name, status and the key date only. */
  variant?: 'full' | 'compact';
  /** Past due: the "Update payment method" action (a callback; no payment fields here). */
  onUpdatePayment?: () => void;
  /** The payment provider's hosted fields, shown in the past-due notice. Never card inputs from this library. */
  paymentFields?: ReactNode;
  /** Heading level of the product name. Default 3. */
  headingLevel?: 2 | 3;
}

/** The date line: next charge, trial end, resume date or cancellation. */
function keyDate(sub: CustomerSubscription): string | undefined {
  if (sub.status === 'cancelled') return undefined;
  if (sub.status === 'trialing' && sub.trialEndsAt) return `Trial ends ${formatCommerceDate(sub.trialEndsAt)}, then ${sub.plan.toLowerCase()} billing starts`;
  if (sub.status === 'past-due') return sub.nextBillingAt ? `Payment failed on ${formatCommerceDate(sub.nextBillingAt)}` : undefined;
  if (sub.status === 'paused') return sub.pausedUntil ? `Billing resumes ${formatCommerceDate(sub.pausedUntil)}` : 'No charges while paused';
  if (sub.cancelAtPeriodEnd) return `Access until ${formatCommerceDate(sub.currentPeriodEnd ?? sub.nextBillingAt ?? '')}`;
  return sub.nextBillingAt ? `Next charge ${formatCommerceDate(sub.nextBillingAt)}` : undefined;
}

/**
 * A subscription: product and plan, price per interval, status badge plus the status sentence (text,
 * never colour alone), the key date, the payment method summary and a Manage link. Past due adds an
 * inline notice with "Update payment method" (callback) and an optional slot for the provider's fields.
 */
export function SubscriptionCard({ subscription: sub, now, href, variant = 'full', onUpdatePayment, paymentFields, headingLevel = 3 }: SubscriptionCardProps) {
  const info = getSubscriptionStatusInfo(sub, now);
  const H = `h${headingLevel}` as const;
  const date = keyDate(sub);
  const compact = variant === 'compact';
  return (
    <article className={[styles.root, styles[variant]].join(' ')} data-status={sub.status}>
      <div className={styles.head}>
        <H className={styles.title}>{sub.productTitle}</H>
        <SubscriptionStatusBadge subscription={sub} now={now} />
      </div>
      <p className={styles.status}>{info.description}</p>
      {!compact && (
        <>
          <div className={styles.plan}>
            <span>{sub.plan}</span>
            <Price price={sub.price} interval={sub.interval} size="sm" />
          </div>
          {date && <p className={styles.meta}>{date}</p>}
          {sub.paymentMethodSummary && sub.status !== 'cancelled' && (
            <p className={styles.meta}>
              <Icon name="credit-card" size="sm" /> Paid with {sub.paymentMethodSummary}
            </p>
          )}
        </>
      )}
      {sub.status === 'past-due' && !compact && (
        <div className={styles.notice} role="note">
          <p>
            <Icon name="alert-circle" size="sm" />
            <strong>Your last payment failed.</strong> Update your payment method to keep your subscription.
          </p>
          {paymentFields}
          {onUpdatePayment && (
            <Button size="sm" onClick={onUpdatePayment}>
              Update payment method
            </Button>
          )}
        </div>
      )}
      {href && (
        <ButtonLink href={href} variant="secondary" size="sm" className={styles.manage} aria-label={`Manage ${sub.productTitle} (${sub.plan})`}>
          Manage
        </ButtonLink>
      )}
    </article>
  );
}
