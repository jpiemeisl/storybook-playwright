import { useState, type ReactNode } from 'react';
import { Badge } from '../../../components/Badge';
import { EmptyState } from '../../../components/EmptyState';
import { Field } from '../../../components/Field';
import { Heading } from '../../../components/Heading';
import { Select } from '../../../components/Select';
import { formatIsoDate } from '../../../utils/formatDate';
import { sortReviews, type ReviewSort } from '../../logic/reviews';
import type { ProductReviewsData, Review } from '../../types/product';
import { LoadMore } from '../LoadMore';
import { Rating } from '../Rating';
import styles from './Reviews.module.css';

/** Average, count and a per-star breakdown (text counts; the bars repeat them visually). */
export function ReviewSummary({ summary, action }: { summary: ProductReviewsData['summary']; action?: ReactNode }) {
  const max = Math.max(1, ...Object.values(summary.distribution));
  return (
    <div className={styles.summary}>
      <div className={styles.average}>
        <span className={styles.big}>{summary.count ? summary.average.toFixed(1) : '–'}</span>
        <Rating value={summary.average} count={summary.count} size="sm" />
      </div>
      <ul className={styles.bars} aria-label="Ratings breakdown">
        {([5, 4, 3, 2, 1] as const).map((star) => (
          <li key={star} className={styles.bar}>
            <span>{star} stars</span>
            <span className={styles.track} aria-hidden="true">
              <span className={styles.fill} style={{ inlineSize: `${(summary.distribution[star] / max) * 100}%` }} />
            </span>
            <span className={styles.barCount}>{new Intl.NumberFormat('en-US').format(summary.distribution[star])}</span>
          </li>
        ))}
      </ul>
      {action}
    </div>
  );
}

const LONG = 320;

function ReviewItem({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const long = review.body.length > LONG;
  return (
    <article className={styles.review}>
      <div className={styles.reviewHead}>
        <Rating value={review.rating} />
        {review.verified && (
          <Badge tone="success" size="sm">
            Verified purchase
          </Badge>
        )}
      </div>
      <Heading as="h3" size="md">
        {review.title ?? `Review by ${review.author}`}
      </Heading>
      <p className={styles.byline}>
        {review.author} · <time dateTime={review.createdAt}>{formatIsoDate(review.createdAt)}</time>
      </p>
      <p className={[styles.body, long && !expanded && styles.clamped].filter(Boolean).join(' ')}>{review.body}</p>
      {long && (
        <button type="button" className={styles.more} aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : 'Read more'}
          <span className={styles.visuallyHidden}> of the review by {review.author}</span>
        </button>
      )}
    </article>
  );
}

export interface ReviewListProps {
  reviews: Review[];
  sort: ReviewSort;
  onSortChange: (sort: ReviewSort) => void;
  /** Reviews per batch. Default 10. */
  pageSize?: number;
  /** No-JavaScript link to more reviews. */
  moreHref?: string;
}

const sortLabels: Record<ReviewSort, string> = { newest: 'Newest', highest: 'Highest rated', lowest: 'Lowest rated' };

/** Sortable review list with "Read more" for long reviews and LoadMore in batches; an empty state for none. */
export function ReviewList({ reviews, sort, onSortChange, pageSize = 10, moreHref = '#reviews' }: ReviewListProps) {
  const [shown, setShown] = useState(pageSize);
  if (reviews.length === 0) return <EmptyState title="No reviews yet" message="Bought this? Be the first to share what you think." headingLevel={3} />;
  const sorted = sortReviews(reviews, sort);
  return (
    <div className={styles.list}>
      <div className={styles.toolbar}>
        <Field label="Sort reviews">
          <Select size="sm" value={sort} onChange={(e) => onSortChange(e.target.value as ReviewSort)} options={(Object.keys(sortLabels) as ReviewSort[]).map((key) => ({ value: key, label: sortLabels[key] }))} />
        </Field>
      </div>
      <ul className={styles.items}>
        {sorted.slice(0, shown).map((review) => (
          <li key={review.id}>
            <ReviewItem review={review} />
          </li>
        ))}
      </ul>
      <LoadMore shown={Math.min(shown, sorted.length)} total={sorted.length} href={moreHref} noun="reviews" onLoadMore={() => setShown((n) => n + pageSize)} />
    </div>
  );
}
