import type { ProductReviewsData, Review } from '../types/product';

/** Review list sort orders used by sortReviews and the review list sort control (`highest`/`lowest` break ties by newest). */
export type ReviewSort = 'newest' | 'highest' | 'lowest';

/** Stable review sort; ties by id. */
export function sortReviews(reviews: readonly Review[], sort: ReviewSort): Review[] {
  const byId = (a: Review, b: Review) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const compare: Record<ReviewSort, (a: Review, b: Review) => number> = {
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt) || byId(a, b),
    highest: (a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt) || byId(a, b),
    lowest: (a, b) => a.rating - b.rating || b.createdAt.localeCompare(a.createdAt) || byId(a, b),
  };
  return [...reviews].sort(compare[sort]);
}

/** Summary (average to one decimal, count, per-star distribution) computed from a list of reviews. */
export function summarizeReviews(reviews: readonly Review[]): ProductReviewsData['summary'] {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
  for (const review of reviews) distribution[Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5] += 1;
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return { average: reviews.length ? Math.round((total / reviews.length) * 10) / 10 : 0, count: reviews.length, distribution };
}
