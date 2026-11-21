import { Fragment, type ReactNode } from 'react';
import type { Money } from '../../../content-types/money';
import { formatMoney } from '../../../utils/formatMoney';
import { formatInterval, formatTrial } from '../../logic/pricing';
import type { BillingInterval } from '../../types/product';
import styles from './Price.module.css';

export interface PriceProps {
  /** Current price (after any sale). */
  price: Money;
  /** Original price; shown struck through when higher than `price`. */
  compareAt?: Money;
  /** Billing interval for recurring prices: "$9.00 / month". */
  interval?: BillingInterval;
  /** Free trial length; with `interval`: "Free for 14 days, then $9.00 / month". */
  trialDays?: number;
  size?: 'sm' | 'md' | 'lg';
  /** "From $X" for products whose variants differ in price. */
  from?: boolean;
  /** Price per unit of measure, e.g. { price: $2.50, per: "100 g" }. */
  unitPrice?: { price: Money; per: string };
  align?: 'start' | 'center' | 'end';
}

/** A formatted amount with break opportunities after group separators: "$12,499.00" wraps as "$12," / "499.00". */
function breakable(text: string): ReactNode {
  const parts = text.split(/(?<=,)/);
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && <wbr />}
    </Fragment>
  ));
}

/**
 * A price with sale, recurring, trial, "from" and unit-price variants. Sale prices announce both
 * amounts ("Sale price $19.00, regular price $25.00") through visually hidden text. Long amounts wrap
 * rather than overflow narrow containers.
 */
export function Price({ price, compareAt, interval, trialDays, size = 'md', from = false, unitPrice, align = 'start' }: PriceProps) {
  const onSale = compareAt !== undefined && compareAt.currency === price.currency && compareAt.amount > price.amount;
  const free = price.amount === 0 && !interval;
  const trial = interval ? formatTrial(trialDays) : '';
  const per = interval ? (interval.count === 1 ? `/ ${interval.unit}` : formatInterval(interval)) : '';

  return (
    <div className={[styles.price, styles[size], styles[align]].join(' ')}>
      <span className={styles.line}>
        {trial && <span className={styles.trial}>{trial}, then </span>}
        {from && <span className={styles.from}>From </span>}
        <span className={[styles.current, onSale && styles.sale].filter(Boolean).join(' ')}>
          {onSale && <span className={styles.visuallyHidden}>Sale price </span>}
          {free ? 'Free' : breakable(formatMoney(price))}
        </span>
        {onSale && (
          <s className={styles.original}>
            <span className={styles.visuallyHidden}>, regular price </span>
            {breakable(formatMoney(compareAt))}
          </s>
        )}
        {per && <span className={styles.interval}> {per}</span>}
      </span>
      {unitPrice && (
        <span className={styles.unit}>
          ({formatMoney(unitPrice.price)} / {unitPrice.per})
        </span>
      )}
    </div>
  );
}
