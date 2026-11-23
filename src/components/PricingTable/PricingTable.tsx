import { useId, useState } from 'react';
import type { BillingInterval, PricingTier } from '../../component-types/sections';
import { formatMoney } from '../../utils/formatMoney';
import { Badge } from '../Badge';
import { ButtonLink } from '../Button';
import { Grid } from '../Grid';
import { Heading } from '../Heading';
import { Icon } from '../Icon';
import { Text } from '../Text';
import styles from './PricingTable.module.css';

/** Billing period selected in the PricingTable toggle. `year` shows each tier's `annualPrice` where it has one. */
export type BillingPeriod = 'month' | 'year';

/** Props for PricingTable. The billing period can be controlled (`billingPeriod`) or uncontrolled (`defaultBillingPeriod`). */
export interface PricingTableProps {
  /** Tiers to show, one card each. A tier without a price shows "Custom"; `highlighted` tiers get a "Recommended" badge unless they set their own. */
  tiers: PricingTier[];
  /** Controlled billing period. Omit to let the table manage it. */
  billingPeriod?: BillingPeriod;
  /** Initial period when uncontrolled. Default "month". */
  defaultBillingPeriod?: BillingPeriod;
  /** Called when the user picks a period, in both controlled and uncontrolled mode. */
  onBillingPeriodChange?: (period: BillingPeriod) => void;
  /** Shown next to the annual option, e.g. "Save 20%". Not computed. */
  annualSavingsLabel?: string;
  /** Level of each tier name. Default 3. */
  headingLevel?: 2 | 3 | 4;
}

const intervalText: Record<BillingInterval, { visible: string; spoken: string }> = {
  month: { visible: '/month', spoken: 'per month' },
  year: { visible: '/year', spoken: 'per year' },
  'one-time': { visible: 'one-time', spoken: 'one-time payment' },
};

/**
 * Pricing tiers with an optional Monthly/Annual toggle (shown when any tier has an `annualPrice`).
 * The toggle is a native radio group, so arrow keys and screen reader semantics come for free.
 */
export function PricingTable({
  tiers,
  billingPeriod,
  defaultBillingPeriod = 'month',
  onBillingPeriodChange,
  annualSavingsLabel,
  headingLevel = 3,
}: PricingTableProps) {
  const groupName = useId();
  const [internalPeriod, setInternalPeriod] = useState(defaultBillingPeriod);
  const period = billingPeriod ?? internalPeriod;
  const hasAnnual = tiers.some((tier) => tier.annualPrice !== undefined);

  const choose = (next: BillingPeriod) => {
    if (billingPeriod === undefined) setInternalPeriod(next);
    onBillingPeriodChange?.(next);
  };

  return (
    <div className={styles.root}>
      {hasAnnual && (
        <fieldset className={styles.toggle}>
          <legend className={styles.visuallyHidden}>Billing period</legend>
          {(['month', 'year'] as const).map((option) => (
            <label key={option} className={styles.option}>
              <input
                type="radio"
                name={groupName}
                value={option}
                checked={period === option}
                onChange={() => choose(option)}
                className={styles.radio}
              />
              {option === 'month' ? 'Monthly' : 'Annual'}
              {option === 'year' && annualSavingsLabel && <span className={styles.savings}>{annualSavingsLabel}</span>}
            </label>
          ))}
        </fieldset>
      )}

      <Grid as="ul" columns={{ base: 1, sm: 2, lg: Math.min(tiers.length, 4) }} gap="lg" className={styles.grid}>
        {tiers.map((tier) => (
          <li key={tier.id}>
            <Tier tier={tier} period={period} headingLevel={headingLevel} />
          </li>
        ))}
      </Grid>
    </div>
  );
}

function Tier({ tier, period, headingLevel }: { tier: PricingTier; period: BillingPeriod; headingLevel: 2 | 3 | 4 }) {
  const headingId = useId();
  const annual = period === 'year' && tier.annualPrice !== undefined;
  const price = annual ? (tier.annualPrice ?? null) : tier.price;
  const interval = annual ? 'year' : tier.interval;
  const badge = tier.badge ?? (tier.highlighted ? 'Recommended' : undefined);

  return (
    <article aria-labelledby={headingId} className={[styles.tier, tier.highlighted && styles.highlighted].filter(Boolean).join(' ')}>
      <div className={styles.header}>
        {badge && (
          <Badge tone={tier.highlighted ? 'accent' : 'neutral'} size="sm" className={styles.badge}>
            {badge}
          </Badge>
        )}
        <Heading as={`h${headingLevel}` as const} size="lg" id={headingId}>
          {tier.name}
        </Heading>
        {tier.description && (
          <Text size="sm" tone="muted">
            {tier.description}
          </Text>
        )}
      </div>

      <p className={styles.price}>
        <span className={styles.amount}>{price ? formatMoney(price, { trimWholeAmounts: true }) : 'Custom'}</span>
        {price && interval && (
          <span className={styles.interval}>
            <span aria-hidden="true">{intervalText[interval].visible}</span>
            <span className={styles.visuallyHidden}> {intervalText[interval].spoken}</span>
          </span>
        )}
      </p>

      <ul className={styles.features}>
        {tier.features.map((feature) => (
          <li key={feature.label} className={feature.included ? styles.included : styles.excluded}>
            <Icon name={feature.included ? 'check' : 'close'} size="sm" className={styles.featureIcon} />
            <span>
              <span className={styles.visuallyHidden}>{feature.included ? 'Included: ' : 'Not included: '}</span>
              {feature.label}
            </span>
          </li>
        ))}
      </ul>

      <ButtonLink href={tier.cta.href} variant={tier.highlighted ? 'primary' : 'secondary'} className={styles.cta}>
        {tier.cta.label}
      </ButtonLink>
    </article>
  );
}
