import { Icon, type IconName } from '../../../components/Icon';
import { Link } from '../../../components/Link';
import styles from './Rating.module.css';

/** Props for Rating, the display-only star rating with an optional review count and link. */
export interface RatingProps {
  /** Average rating 0-5; displayed to the nearest half star. */
  value: number;
  /** Number of reviews. 0 shows "No reviews yet". */
  count?: number;
  /** Link to the reviews, e.g. "#reviews". */
  href?: string;
  size?: 'sm' | 'md';
}

const formatCount = (count: number) => new Intl.NumberFormat('en-US').format(count);

/** Five star icons for a value rounded to the nearest half. */
export function starIcons(value: number): IconName[] {
  const rounded = Math.round(Math.min(Math.max(value, 0), 5) * 2) / 2;
  return [1, 2, 3, 4, 5].map((i) => (rounded >= i ? 'star' : rounded >= i - 0.5 ? 'star-half' : 'star-empty'));
}

/** "Rated 4.5 out of 5 from 128 reviews". */
export function ratingLabel(value: number, count?: number): string {
  if (count === 0) return 'No reviews yet';
  const rounded = Math.round(Math.min(Math.max(value, 0), 5) * 10) / 10;
  const base = `Rated ${rounded} out of 5`;
  return count === undefined ? base : `${base} from ${formatCount(count)} ${count === 1 ? 'review' : 'reviews'}`;
}

/**
 * Display-only star rating. The container carries the accessible name; stars are decorative.
 * Stars use currentColor (the rating token), so they stay visible in forced-colors mode, and filled,
 * half and empty stars differ in shape, not only colour.
 */
export function Rating({ value, count, href, size = 'md' }: RatingProps) {
  const none = count === 0;
  const label = ratingLabel(value, count);
  const content = (
    <>
      <span className={styles.stars} aria-hidden="true">
        {starIcons(none ? 0 : value).map((icon, i) => (
          <Icon key={i} name={icon} size="sm" className={[styles.star, icon === 'star-empty' && styles.empty].filter(Boolean).join(' ')} />
        ))}
      </span>
      <span className={styles.text} aria-hidden="true">
        {none ? 'No reviews yet' : count === undefined ? Math.round(value * 10) / 10 : `${Math.round(value * 10) / 10} (${formatCount(count)} ${count === 1 ? 'review' : 'reviews'})`}
      </span>
    </>
  );
  const classes = [styles.rating, styles[size]].join(' ');
  return href ? (
    <Link href={href} unstyled className={[classes, styles.link].join(' ')} aria-label={label}>
      {content}
    </Link>
  ) : (
    <span className={classes} role="img" aria-label={label}>
      {content}
    </span>
  );
}
