import { useEffect, useRef, useState } from 'react';
import { Badge } from '../../../components/Badge';
import { Icon } from '../../../components/Icon';
import { Link } from '../../../components/Link';
import styles from './CartIcon.module.css';

export interface CartIconProps {
  /** Items in the cart (sum of quantities). */
  count: number;
  /** Renders a link to the cart page. */
  href?: string;
  /** Renders a button instead (e.g. to open MiniCart). Ignored when `href` is set. */
  onClick?: () => void;
  /** Button only: whether the mini cart it opens is showing. */
  expanded?: boolean;
}

const itemsText = (count: number) => `${count} ${count === 1 ? 'item' : 'items'}`;

/**
 * Cart icon with a count badge, as a link or a button. The accessible name carries the real count
 * ("Cart, 120 items") while the badge caps at "99+"; an empty cart shows no badge. Count changes after
 * the first render are announced politely through a separate visually hidden live region.
 */
export function CartIcon({ count, href, onClick, expanded }: CartIconProps) {
  const [announcement, setAnnouncement] = useState('');
  const previous = useRef(count);
  useEffect(() => {
    if (previous.current !== count) setAnnouncement(`Cart updated, ${itemsText(count)}`);
    previous.current = count;
  }, [count]);

  const label = `Cart, ${itemsText(count)}`;
  const content = <Icon name="cart" />;

  return (
    <span className={styles.root}>
      {href ? (
        <Link href={href} unstyled className={styles.control} aria-label={label}>
          {content}
        </Link>
      ) : (
        <button type="button" className={styles.control} aria-label={label} aria-haspopup="dialog" aria-expanded={expanded} onClick={onClick}>
          {content}
        </button>
      )}
      {/* Outside the control so its visible text never competes with the accessible name. */}
      {count > 0 && (
        <Badge tone="accent" size="sm" className={styles.badge} aria-hidden="true">
          {count > 99 ? '99+' : count}
        </Badge>
      )}
      <span role="status" className={styles.visuallyHidden}>
        {announcement}
      </span>
    </span>
  );
}
