import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { reviewsData } from '../../fixtures';
import type { ReviewSort } from '../../logic/reviews';
import type { ProductReviewsData } from '../../types/product';
import { ReviewList, ReviewSummary } from './Reviews';

function Reviews({ data }: { data: ProductReviewsData }) {
  const [sort, setSort] = useState<ReviewSort>('newest');
  return (
    <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'minmax(0, 18rem) minmax(0, 1fr)' }}>
      <ReviewSummary summary={data.summary} />
      <ReviewList reviews={data.reviews} sort={sort} onSortChange={setSort} />
    </div>
  );
}

const meta = { title: 'Commerce/Reviews' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const NoReviews: Story = { render: () => <Reviews data={reviewsData.none} /> };
export const Three: Story = { render: () => <Reviews data={reviewsData.three} /> };
export const Forty: Story = { parameters: { vrt: { viewports: [{ width: 1280, fullPage: true }] } }, render: () => <Reviews data={reviewsData.forty} /> };

/** A long review is clamped; "Read more" expands it and toggles aria-expanded. */
export const LongReview: Story = {
  render: () => <Reviews data={{ ...reviewsData.forty, reviews: reviewsData.forty.reviews.filter((r) => r.body.length > 320) }} />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: /Read more/ });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(button);
    await expect(within(canvasElement).getByRole('button', { name: /Show less/ })).toHaveAttribute('aria-expanded', 'true');
  },
};
