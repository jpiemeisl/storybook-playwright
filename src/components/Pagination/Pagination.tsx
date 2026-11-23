import type { ReactNode } from 'react';
import { Icon } from '../Icon';
import { Link } from '../Link';
import styles from './Pagination.module.css';

interface PaginationBaseProps {
  /** 1-based. */
  currentPage: number;
  /** Total number of pages. With 1 or fewer, nothing is rendered. */
  totalPages: number;
  /** Pages shown either side of the current page before an ellipsis. Default 1. */
  siblingCount?: number;
  /** Accessible name of the nav landmark. Default "Pagination". */
  'aria-label'?: string;
  className?: string;
}

/** Link mode (`hrefBuilder`) for crawlable URLs, or button mode (`onPageChange`) for client state. */
export type PaginationProps = PaginationBaseProps &
  (
    | { hrefBuilder: (page: number) => string; onPageChange?: never }
    | { onPageChange: (page: number) => void; hrefBuilder?: never }
  );

type PageEntry = number | 'gap-start' | 'gap-end';

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** First, last, current ± siblings; an ellipsis only where it hides two or more pages. */
export function pageRange(current: number, total: number, siblings = 1): PageEntry[] {
  const slots = siblings * 2 + 5;
  if (total <= slots) return range(1, total);
  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);
  const edge = siblings * 2 + 3;
  if (left <= 3) return [...range(1, edge), 'gap-end', total];
  if (right >= total - 2) return [1, 'gap-start', ...range(total - edge + 1, total)];
  return [1, 'gap-start', ...range(left, right), 'gap-end', total];
}

/**
 * Page navigation for a paged list: previous/next plus numbered pages with ellipses, collapsing to
 * "Page X of Y" with previous/next on narrow slots. Renders nothing when there is only one page.
 *
 * The current page gets aria-current="page"; previous/next at the ends stay focusable with
 * aria-disabled instead of being removed.
 */
export function Pagination({
  currentPage,
  totalPages,
  siblingCount = 1,
  hrefBuilder,
  onPageChange,
  'aria-label': label = 'Pagination',
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const current = Math.min(Math.max(currentPage, 1), totalPages);

  const control = (page: number, content: ReactNode, name: string, extra: { current?: boolean; disabled?: boolean } = {}) => {
    const classes = [styles.control, extra.current && styles.current].filter(Boolean).join(' ');
    if (extra.disabled) {
      return hrefBuilder ? (
        <a role="link" aria-disabled="true" aria-label={name} className={classes}>
          {content}
        </a>
      ) : (
        <button type="button" aria-disabled="true" aria-label={name} className={classes}>
          {content}
        </button>
      );
    }
    const ariaCurrent = extra.current ? 'page' : undefined;
    return hrefBuilder ? (
      <Link href={hrefBuilder(page)} externalIcon={false} aria-label={name} aria-current={ariaCurrent} className={classes}>
        {content}
      </Link>
    ) : (
      <button type="button" aria-label={name} aria-current={ariaCurrent} className={classes} onClick={() => onPageChange?.(page)}>
        {content}
      </button>
    );
  };

  const previous = control(
    current - 1,
    <>
      <Icon name="arrow-left" size="sm" />
      <span>Previous</span>
    </>,
    'Previous page',
    { disabled: current === 1 },
  );
  const next = control(
    current + 1,
    <>
      <span>Next</span>
      <Icon name="arrow-right" size="sm" />
    </>,
    'Next page',
    { disabled: current === totalPages },
  );

  return (
    <nav aria-label={label} className={[styles.pagination, className].filter(Boolean).join(' ')}>
      <ul className={styles.full}>
        <li>{previous}</li>
        {pageRange(current, totalPages, siblingCount).map((entry) =>
          typeof entry === 'number' ? (
            <li key={entry}>{control(entry, entry, `Page ${entry}`, { current: entry === current })}</li>
          ) : (
            <li key={entry} className={styles.gap} aria-hidden="true">
              …
            </li>
          ),
        )}
        <li>{next}</li>
      </ul>

      <div className={styles.compact}>
        {previous}
        <span className={styles.status}>
          Page {current} of {totalPages}
        </span>
        {next}
      </div>
    </nav>
  );
}
