import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import layout from '../../stories/storyLayout.module.css';
import { Rating } from './Rating';

const meta = {
  title: 'Commerce/Rating',
  component: Rating,
  tags: ['vrt-mobile'],
  args: { value: 4.5, count: 128 },
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllStates: Story = {
  render: () => (
    <div className={layout.stack}>
      <Rating value={0} count={0} />
      <Rating value={1} count={1} />
      <Rating value={3.5} />
      <Rating value={4.5} count={128} />
      <Rating value={5} count={4000} />
      <Rating value={4.24} count={57} size="sm" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('img', { name: 'No reviews yet' })).toBeVisible();
    await expect(canvas.getByRole('img', { name: 'Rated 4.5 out of 5 from 128 reviews' })).toBeVisible();
    await expect(canvas.getByRole('img', { name: 'Rated 5 out of 5 from 4,000 reviews' })).toBeVisible();
    await expect(canvas.getByRole('img', { name: 'Rated 3.5 out of 5' })).toBeVisible();
  },
};

export const NoReviews: Story = { args: { value: 0, count: 0 } };
export const WithCount: Story = {};

/** As a link to the reviews, focused (keyboard). */
export const AsLink: Story = {
  args: { href: '#reviews' },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'Rated 4.5 out of 5 from 128 reviews' });
    await userEvent.tab();
    await expect(link).toHaveFocus();
  },
};
