import type { FocusEvent } from 'react';
import type { CategoryItem, TagItem } from '../../content-types/content';
import { Link } from '../Link';
import styles from './TagList.module.css';

export interface TagListProps {
  items: TagItem[];
  size?: 'sm' | 'md';
  /** Accessible name for the list, e.g. "Tags". */
  label?: string;
}

function Count({ count }: { count?: number }) {
  if (count === undefined) return null;
  return (
    <span className={styles.count}>
      <span aria-hidden="true">{count}</span>
      <span className={styles.visuallyHidden}> ({count} {count === 1 ? 'post' : 'posts'})</span>
    </span>
  );
}

/** Wrapping list of tags. Items with `href` are links; others are plain labels. */
export function TagList({ items, size = 'md', label = 'Tags' }: TagListProps) {
  if (items.length === 0) return null;
  return (
    <ul aria-label={label} className={[styles.list, styles[size]].join(' ')}>
      {items.map((item) => (
        <li key={item.label}>
          {item.href ? (
            <Link href={item.href} unstyled className={[styles.tag, styles.linked].join(' ')}>
              {item.label}
              <Count count={item.count} />
            </Link>
          ) : (
            <span className={styles.tag}>
              {item.label}
              <Count count={item.count} />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

interface CategoryFilterBaseProps {
  items: CategoryItem[];
  /** Selected item ids. Links mode: the current category. Buttons mode: the pressed filters. */
  selectedIds?: string[];
  /** Accessible name of the nav (links) or group (buttons). */
  label?: string;
}

export type CategoryFilterProps = CategoryFilterBaseProps &
  (
    | { mode?: 'links' }
    | {
        mode: 'buttons';
        onChange: (selectedIds: string[]) => void;
        /** Allow several pressed at once. Default false (single choice; pressing again clears). */
        multiple?: boolean;
      }
  );

/**
 * Category navigation (links with aria-current) or filter toggles (buttons with aria-pressed).
 * Scrolls horizontally on narrow containers instead of wrapping.
 */
export function CategoryFilter(props: CategoryFilterProps) {
  const { items, selectedIds = [], label = 'Categories' } = props;

  // Keep the focused item fully visible inside the scroller.
  const onFocus = (event: FocusEvent<HTMLUListElement>) => {
    (event.target as HTMLElement).scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  };

  if (props.mode === 'buttons') {
    const { onChange, multiple = false } = props;
    const toggle = (id: string) => {
      const pressed = selectedIds.includes(id);
      if (multiple) onChange(pressed ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]);
      else onChange(pressed ? [] : [id]);
    };
    return (
      <div role="group" aria-label={label} className={styles.filter}>
        <ul className={styles.scroller} onFocus={onFocus}>
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={selectedIds.includes(item.id)}
                className={styles.chip}
                onClick={() => toggle(item.id)}
              >
                {item.label}
                <Count count={item.count} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <nav aria-label={label} className={styles.filter}>
      <ul className={styles.scroller} onFocus={onFocus}>
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href ?? `#${item.id}`}
              unstyled
              className={styles.chip}
              aria-current={selectedIds.includes(item.id) ? 'page' : undefined}
            >
              {item.label}
              <Count count={item.count} />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
