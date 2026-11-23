import { Icon, type IconName } from '../../../components/Icon';
import type { CartFlags } from '../../logic/cart';
import styles from './TrustBadges.module.css';

/** Props for TrustBadges, the checkout reassurance list. */
export interface TrustBadgesProps {
  /** `totals.flags`: decides which items apply. */
  flags: Pick<CartFlags, 'hasShippable' | 'hasDigital' | 'hasSubscription'>;
}

/**
 * Plain text-and-icon reassurances, each only when it applies: secure checkout (always), easy returns
 * (shippable items), instant digital delivery, cancel anytime (subscriptions). Icons are decorative;
 * no payment brand logos.
 */
export function TrustBadges({ flags }: TrustBadgesProps) {
  const items: [IconName, string, boolean][] = [
    ['lock', 'Secure checkout', true],
    ['refresh', 'Easy 30-day returns', flags.hasShippable],
    ['download', 'Instant digital delivery', flags.hasDigital],
    ['repeat', 'Cancel subscriptions anytime', flags.hasSubscription],
  ];
  return (
    <ul className={styles.root} aria-label="Why shop with us">
      {items
        .filter(([, , show]) => show)
        .map(([icon, text]) => (
          <li key={text}>
            <Icon name={icon} size="sm" />
            {text}
          </li>
        ))}
    </ul>
  );
}
