import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { expectCurrentNav, expectCurrentPage, expectPageInvariants, templateMeta, type TemplateStoryArgs } from '../../stories/templatePages';

const meta = {
  title: 'Templates/Blog index',
  tags: ['vrt-mobile'],
  ...templateMeta,
  args: { ...templateMeta.args, name: 'blog-index' },
  play: async ({ canvasElement, args }) => expectPageInvariants(canvasElement, args),
} satisfies Meta<TemplateStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Page 2 of 4: featured post, 12 posts, categories. */
export const BlogIndex: Story = {
  tags: ['!vrt-mobile', 'vrt-full'],
  play: async ({ canvasElement, args }) => {
    await expectPageInvariants(canvasElement, args);
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: /All posts/ })).toHaveAttribute('aria-current', 'page');
    await expectCurrentPage(canvasElement, 'Blog pages', 2);
    await expectCurrentNav(canvasElement, 'Blog');
  },
};

export const Empty: Story = {
  args: { name: 'blog-index-empty' },
  play: async ({ canvasElement, args }) => {
    await expectPageInvariants(canvasElement, args);
    await expect(within(canvasElement).getByRole('link', { name: 'See all posts' })).toHaveAttribute('href', '/blog');
  },
};

export const OnePost: Story = { args: { name: 'blog-index-one-post' } };
