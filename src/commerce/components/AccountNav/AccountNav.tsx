import { Badge } from '../../../components/Badge';
import { Icon, type IconName } from '../../../components/Icon';
import { Link } from '../../../components/Link';
import hint from '../../../components/scrollHint.module.css';
import styles from './AccountNav.module.css';

export type AccountSection = 'overview' | 'orders' | 'downloads' | 'subscriptions' | 'addresses' | 'wishlist';

export interface AccountNavProps {
  /** Path of the page being viewed: the matching item gets aria-current="page". */
  currentPath?: string;
  /** Base path for the links. Default "/account". */
  basePath?: string;
  /** Count badges per section, e.g. { orders: 12, wishlist: 3 }. */
  counts?: Partial<Record<AccountSection, number>>;
  /** Which optional sections have data: Downloads and Subscriptions show only when true (or in `alwaysShow`). */
  has?: { downloads?: boolean; subscriptions?: boolean };
  /** Show these sections even without data. */
  alwaysShow?: AccountSection[];
  /** Shows a "Sign out" button. */
  onSignOut?: () => void;
  /** Landmark name. Default "Account". Give each nav on a page a unique name. */
  label?: string;
}

const sections: { id: AccountSection; label: string; path: string; icon: IconName }[] = [
  { id: 'overview', label: 'Overview', path: '', icon: 'user' },
  { id: 'orders', label: 'Orders', path: '/orders', icon: 'package' },
  { id: 'downloads', label: 'Downloads', path: '/downloads', icon: 'download' },
  { id: 'subscriptions', label: 'Subscriptions', path: '/subscriptions', icon: 'repeat' },
  { id: 'addresses', label: 'Addresses', path: '/addresses', icon: 'map-pin' },
  { id: 'wishlist', label: 'Wishlist', path: '/wishlist', icon: 'heart' },
];

/** The section a path belongs to: exact match for Overview, prefix match for the rest. */
export function currentSection(currentPath: string | undefined, basePath = '/account'): AccountSection | undefined {
  if (!currentPath) return undefined;
  const path = currentPath.replace(/\/$/, '');
  return [...sections].reverse().find((s) => (s.path ? path === basePath + s.path || path.startsWith(`${basePath}${s.path}/`) : path === basePath))?.id;
}

/**
 * Account navigation: a labelled nav landmark with links and optional count badges. Downloads and
 * Subscriptions appear only when the customer has some. A vertical list on wide containers; on narrow
 * ones a horizontally scrollable row (CSS scroll-snap, the current item snapped into view, a visible
 * focus ring kept inside the scroller by scroll-padding). The count is part of the link name.
 */
export function AccountNav({ currentPath, basePath = '/account', counts = {}, has = {}, alwaysShow = [], onSignOut, label = 'Account' }: AccountNavProps) {
  const current = currentSection(currentPath, basePath);
  const shown = sections.filter((s) => (s.id !== 'downloads' && s.id !== 'subscriptions') || has[s.id] || alwaysShow.includes(s.id));
  return (
    <nav className={styles.root} aria-label={label}>
      <ul className={`${styles.list} ${hint.hint}`}>
        {shown.map((s) => {
          const count = counts[s.id];
          return (
            <li key={s.id} className={styles.item}>
              <Link href={basePath + s.path} unstyled className={styles.link} aria-current={current === s.id ? 'page' : undefined}>
                <Icon name={s.icon} size="sm" />
                <span>{s.label}</span>
                {count !== undefined && count > 0 && (
                  <Badge size="sm" className={styles.count}>
                    <span className={styles.visuallyHidden}>, </span>
                    {count}
                  </Badge>
                )}
              </Link>
            </li>
          );
        })}
        {onSignOut && (
          <li className={styles.item}>
            <button type="button" className={styles.link} onClick={onSignOut}>
              <Icon name="log-out" size="sm" />
              <span>Sign out</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
