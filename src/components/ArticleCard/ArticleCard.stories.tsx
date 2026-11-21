import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { articleEdgeCases, articles } from '../../fixtures/sections';
import { inSection } from '../../stories/inSection';
import { CardGrid } from '../Card';
import { ArticleCard } from './ArticleCard';

const meta = {
  title: 'Sections/ArticleCard',
  component: ArticleCard,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { article: articles[0]! },
} satisfies Meta<typeof ArticleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grid: Story = {
  render: () => (
    <CardGrid>
      {articles.map((article) => (
        <ArticleCard key={article.href} article={article} />
      ))}
    </CardGrid>
  ),
  play: async ({ canvasElement }) => {
    const time = canvasElement.querySelector('time');
    await expect(time).toHaveAttribute('datetime', '2026-03-14');
    await expect(time).toHaveTextContent('Mar 14, 2026');
    await expect(within(canvasElement).getAllByRole('link')).toHaveLength(articles.length);
  },
};

export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
  render: (args) => (
    <div style={{ maxInlineSize: '48rem' }}>
      <ArticleCard {...args} />
    </div>
  ),
};

/** Missing image, excerpt and author, and an article with only the required fields. */
export const EdgeCases: Story = {
  render: () => (
    <CardGrid columns={4}>
      {Object.values(articleEdgeCases).map((article) => (
        <ArticleCard key={article.title} article={article} />
      ))}
    </CardGrid>
  ),
};
