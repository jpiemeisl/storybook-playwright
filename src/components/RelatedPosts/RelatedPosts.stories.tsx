import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { extraArticle, relatedArticles } from '../../fixtures/content';
import { inSection } from '../../stories/inSection';
import { RelatedPosts } from './RelatedPosts';

const meta = {
  title: 'Content/RelatedPosts',
  component: RelatedPosts,
  tags: ['vrt-mobile'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { items: relatedArticles },
} satisfies Meta<typeof RelatedPosts>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Three: Story = {};

export const Four: Story = {
  args: { items: [...relatedArticles, extraArticle] },
};

export const One: Story = {
  args: { items: relatedArticles.slice(0, 1) },
};

/** No items: renders nothing. */
export const None: Story = {
  args: { items: [] },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[aria-label="Related articles"]')).toBeNull();
  },
};
