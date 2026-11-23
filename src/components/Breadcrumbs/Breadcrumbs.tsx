import type { BreadcrumbItem } from '../../content-types/navigation';
import { Link } from '../Link';
import styles from './Breadcrumbs.module.css';

/** Props for Breadcrumbs. Renders nothing when `items` is empty. */
export interface BreadcrumbsProps {
  /** Ancestors first; the last item is the current page. */
  items: BreadcrumbItem[];
  /** Accessible name of the nav landmark. Default "Breadcrumb". */
  'aria-label'?: string;
  className?: string;
}

/**
 * Breadcrumb trail. Separators are CSS-only and not announced. When the slot is narrower than 40rem
 * and there are more than 3 items, the middle items are visually collapsed into an ellipsis (keeping
 * the first and last two); they stay in the accessibility tree.
 */
export function Breadcrumbs({ items, 'aria-label': label = 'Breadcrumb', className }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  const collapsible = items.length > 3;
  const lastIndex = items.length - 1;

  return (
    <nav aria-label={label} className={[styles.breadcrumbs, className].filter(Boolean).join(' ')}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isMiddle = collapsible && index > 0 && index < lastIndex - 1;
          return [
            collapsible && index === 1 && (
              <li key="ellipsis" className={styles.ellipsis} aria-hidden="true">
                …
              </li>
            ),
            <li key={`${index}-${item.label}`} className={isMiddle ? styles.middle : undefined}>
              {index === lastIndex || !item.href ? (
                <span aria-current={index === lastIndex ? 'page' : undefined} className={styles.current}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              )}
            </li>,
          ];
        })}
      </ol>
    </nav>
  );
}
