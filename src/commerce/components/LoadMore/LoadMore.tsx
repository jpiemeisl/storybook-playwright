import { useId, type MouseEvent } from 'react';
import { ButtonLink } from '../../../components/Button';
import styles from './LoadMore.module.css';

export interface LoadMoreProps {
  /** Items currently shown. */
  shown: number;
  /** Total items. Nothing renders once everything is shown. */
  total: number;
  /** URL of the next page: the no-JavaScript fallback (and what the link opens if `onLoadMore` is absent). */
  href: string;
  /** Load the next batch in place. */
  onLoadMore?: () => void;
  loading?: boolean;
  /** Noun for the count. Default "products". */
  noun?: string;
}

/**
 * "Showing 12 of 48" with a progress bar and a link to the next page. With `onLoadMore` the link loads
 * in place (progressive enhancement); without JavaScript it simply navigates.
 */
export function LoadMore({ shown, total, href, onLoadMore, loading = false, noun = 'products' }: LoadMoreProps) {
  const statusId = useId();
  if (shown >= total) return null;
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onLoadMore) return;
    event.preventDefault();
    if (!loading) onLoadMore();
  };
  return (
    <div className={styles.root}>
      <p id={statusId} className={styles.status} role="status">
        Showing {shown} of {total} {noun}
      </p>
      <progress className={styles.progress} max={total} value={shown} aria-labelledby={statusId} aria-valuemin={0} aria-valuemax={total} aria-valuenow={shown} />
      <ButtonLink href={href} variant="secondary" onClick={onClick} aria-busy={loading || undefined} aria-disabled={loading || undefined}>
        {loading ? 'Loading…' : `Load more ${noun}`}
      </ButtonLink>
    </div>
  );
}
