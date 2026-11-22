import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { expectPageInvariants, templateMeta, type TemplateStoryArgs } from '../../stories/templatePages';

const meta = {
  title: 'Templates/Blog post',
  tags: ['vrt-mobile'],
  ...templateMeta,
  args: { ...templateMeta.args, name: 'blog-post' },
  play: async ({ canvasElement, args }) => expectPageInvariants(canvasElement, args),
} satisfies Meta<TemplateStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** About 1,200 words, 13 headings: sticky TOC from 64rem, collapsible above the body below. */
export const BlogPost: Story = {
  tags: ['!vrt-mobile', 'vrt-full', 'theme-smoke'],
  play: async ({ canvasElement, args }) => {
    await expectPageInvariants(canvasElement, args);
    const toc = within(canvasElement).getByRole('navigation', { name: 'On this page' });
    const targets = [...toc.querySelectorAll('a')].map((a) => a.getAttribute('href')!.slice(1));
    await expect(targets.length).toBeGreaterThanOrEqual(8);
    await expect(targets.filter((id) => !document.getElementById(id))).toEqual([]);
  },
};

/** Two headings only: no table of contents. */
export const Short: Story = {
  args: { name: 'blog-post-short' },
  play: async ({ canvasElement, args }) => {
    await expectPageInvariants(canvasElement, args);
    await expect(within(canvasElement).queryByRole('navigation', { name: 'On this page' })).toBeNull();
  },
};

/** No hero image, avatar, tags, related posts or bio. */
export const Minimal: Story = { args: { name: 'blog-post-minimal' } };

export const LongTitles: Story = {
  args: { name: 'blog-post-long-titles' },
  play: async ({ canvasElement, args }) => {
    await expectPageInvariants(canvasElement, args);
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/** Narrow screens: the table of contents expanded above the article body. */
export const MobileTocExpanded: Story = {
  parameters: { layout: 'fullscreen', vrt: { viewports: [375] } },
  play: async ({ canvasElement }) => {
    const summary = within(canvasElement).getByText('On this page', { selector: 'summary' });
    if (!summary.checkVisibility()) return; // wide viewport: the TOC is always open
    await userEvent.click(summary);
    await expect(summary.closest('details')).toHaveAttribute('open');
    // Bring the opened list into view (below the sticky header, via scroll-padding).
    summary.closest('details')!.scrollIntoView({ block: 'start' });
  },
};
