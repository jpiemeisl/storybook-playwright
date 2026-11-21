import { Link } from '../Link';
import styles from './LinkList.module.css';

export interface LinkListItem {
  label: string;
  href: string;
  /** Accessible name when the label alone is not descriptive. */
  ariaLabel?: string;
}

export interface LinkListProps {
  items: LinkListItem[];
  /** `row` wraps inline (legal links); `column` stacks (suggested pages). Default "column". */
  direction?: 'row' | 'column';
  size?: 'sm' | 'md';
  /** Accessible name of the list. */
  label?: string;
}

/** A plain list of links: footer legal links, suggested pages, related links. */
export function LinkList({ items, direction = 'column', size = 'md', label }: LinkListProps) {
  if (items.length === 0) return null;
  return (
    <ul aria-label={label} className={[styles.list, styles[direction], styles[size]].join(' ')}>
      {items.map((item) => (
        <li key={item.href + item.label}>
          <Link href={item.href} aria-label={item.ariaLabel}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
