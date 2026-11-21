import { useState } from 'react';
import { Icon } from '../../../components/Icon';
import { Link } from '../../../components/Link';
import type { ActiveFilter } from '../../logic/browse';
import styles from './ActiveFilters.module.css';

export interface ActiveFiltersProps {
  filters: ActiveFilter[];
  /** Live mode: chips are buttons. Without it, chips are links to their `removeHref`. */
  onRemove?: (filter: ActiveFilter) => void;
  onClear?: () => void;
  /** "Clear all" link for the no-JavaScript path. */
  clearHref?: string;
}

/** Removable chips for the active filters plus "Clear all". Removals are announced politely. */
export function ActiveFilters({ filters, onRemove, onClear, clearHref }: ActiveFiltersProps) {
  const [announcement, setAnnouncement] = useState('');
  const remove = (filter: ActiveFilter) => {
    onRemove?.(filter);
    setAnnouncement(`Removed filter: ${filter.label}`);
  };
  const clear = () => {
    onClear?.();
    setAnnouncement('All filters cleared');
  };
  return (
    <div className={styles.root}>
      {filters.length > 0 && (
        <div className={styles.bar}>
          <ul className={styles.list} aria-label="Active filters">
            {filters.map((filter) => (
              <li key={filter.id}>
                {onRemove ? (
                  <button type="button" className={styles.chip} aria-label={`Remove filter: ${filter.label}`} onClick={() => remove(filter)}>
                    {filter.label}
                    <Icon name="close" size="sm" />
                  </button>
                ) : (
                  filter.removeHref && (
                    <Link href={filter.removeHref} unstyled className={styles.chip} aria-label={`Remove filter: ${filter.label}`}>
                      {filter.label}
                      <Icon name="close" size="sm" />
                    </Link>
                  )
                )}
              </li>
            ))}
          </ul>
          {onClear ? (
            <button type="button" className={styles.clear} onClick={clear}>
              Clear all
            </button>
          ) : (
            clearHref && (
              <Link href={clearHref} className={styles.clear}>
                Clear all
              </Link>
            )
          )}
        </div>
      )}
      <span className={styles.visuallyHidden} role="status">
        {announcement}
      </span>
    </div>
  );
}
