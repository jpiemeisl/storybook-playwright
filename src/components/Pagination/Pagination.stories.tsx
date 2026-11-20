import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Pagination } from './Pagination';

const hrefBuilder = (page: number) => `/articles?page=${page}`;

const meta = {
  title: 'Navigation/Pagination',
  component: Pagination,
  tags: ['vrt-full'],
  args: { currentPage: 1, totalPages: 7, hrefBuilder },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One page: renders nothing. */
export const SinglePage: Story = {
  args: { totalPages: 1 },
  render: (args) => (
    <Stack gap="sm">
      <Text tone="muted">Pagination for a single page renders nothing below this line.</Text>
      <Pagination currentPage={args.currentPage} totalPages={args.totalPages} hrefBuilder={hrefBuilder} />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('navigation')).toBeNull();
  },
};

export const TwoPages: Story = {
  args: { totalPages: 2, currentPage: 1 },
};

export const SevenPages: Story = {
  args: { totalPages: 7, currentPage: 4 },
};

/** First of 50: Previous is disabled. */
export const FiftyFirstPage: Story = {
  args: { totalPages: 50, currentPage: 1 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('link', { name: 'Previous page' })[0]).toHaveAttribute('aria-disabled', 'true');
    // hidden: true finds the full page list even when the compact layout is showing (narrow slots).
    await expect(canvas.getByRole('link', { name: 'Page 1', hidden: true })).toHaveAttribute('aria-current', 'page');
  },
};

/** Middle of 50: ellipses on both sides. */
export const FiftyMiddlePage: Story = {
  args: { totalPages: 50, currentPage: 25 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const current = canvas.getByRole('link', { name: 'Page 25', hidden: true });
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(current).toHaveAttribute('href', '/articles?page=25');
  },
};

/** Last of 50: Next is disabled. */
export const FiftyLastPage: Story = {
  args: { totalPages: 50, currentPage: 50 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('link', { name: 'Next page' })[0]).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};

/** Button mode: `onPageChange` instead of links. Next moves aria-current to page 2 (works in both layouts). */
export const ButtonMode: Story = {
  args: { totalPages: 12, currentPage: 1, hrefBuilder: undefined },
  render: function Render(args) {
    const [page, setPage] = useState(args.currentPage);
    return <Pagination currentPage={page} totalPages={args.totalPages} onPageChange={setPage} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(canvas.getByRole('button', { name: 'Page 2', hidden: true })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('button', { name: 'Page 1', hidden: true })).not.toHaveAttribute('aria-current');
    await expect(canvas.getByRole('button', { name: 'Previous page' })).not.toHaveAttribute('aria-disabled');
  },
};

/** Narrow slot: "Page X of Y" with previous and next only. */
export const CompactMobile: Story = {
  args: { totalPages: 50, currentPage: 25 },
  parameters: { vrt: { viewports: [375] } },
};
