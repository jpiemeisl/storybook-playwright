import { Icon } from '../../../components/Icon';
import { Link } from '../../../components/Link';
import { isSafeHref } from '../../../registry/links';
import { buildOrderTimeline } from '../../logic/account';
import { formatCommerceDate } from '../../logic/pricing';
import type { Order } from '../../types/order';
import styles from './OrderTimeline.module.css';

export interface OrderTimelineProps {
  order: Pick<Order, 'status' | 'lines' | 'placedAt' | 'tracking' | 'downloads'>;
  /** Heading level for "Tracking". Default 3. */
  headingLevel?: 3 | 4;
}

const stateText = { done: 'Completed', current: 'In progress', upcoming: 'Upcoming' } as const;

/**
 * The order's milestones (buildOrderTimeline) as an ordered list: done steps show a tick, the current
 * one is marked aria-current="step", and every step carries its state as text for screen readers.
 * Below it, tracking events with the carrier and tracking number; the tracking link is only a link
 * when its href is safe, otherwise it is shown as text.
 */
export function OrderTimeline({ order, headingLevel = 3 }: OrderTimelineProps) {
  const steps = buildOrderTimeline(order);
  const H = `h${headingLevel}` as const;
  const tracking = order.tracking;
  return (
    <div className={styles.root}>
      <ol className={styles.steps}>
        {steps.map((step) => (
          <li key={step.id} className={styles.step} data-state={step.state} aria-current={step.state === 'current' ? 'step' : undefined}>
            <span className={styles.marker} aria-hidden="true">
              {step.state === 'done' && <Icon name="check" size="sm" />}
            </span>
            <span className={styles.text}>
              <span className={styles.label}>{step.label}</span>
              <span className={styles.visuallyHidden}> ({stateText[step.state]})</span>
              {step.at && <span className={styles.date}>{formatCommerceDate(step.at)}</span>}
            </span>
          </li>
        ))}
      </ol>
      {tracking && (
        <div className={styles.tracking}>
          <H className={styles.heading}>Tracking</H>
          <p className={styles.carrier}>
            {tracking.carrier}, tracking number{' '}
            {tracking.url && isSafeHref(tracking.url) ? (
              <Link href={tracking.url} external>
                {tracking.number}
              </Link>
            ) : (
              <span className={styles.code}>{tracking.number}</span>
            )}
          </p>
          <ul className={styles.events}>
            {[...tracking.events].reverse().map((event) => (
              <li key={event.at + event.label}>
                <time dateTime={event.at}>{formatCommerceDate(event.at)}</time> {event.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
