import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { articleHtml, articleNode, shortArticleNode } from '../../fixtures/content';
import { inSection } from '../../stories/inSection';
import { Prose } from './Prose';

const meta = {
  title: 'Content/Prose',
  component: Prose,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { children: articleNode },
} satisfies Meta<typeof Prose>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The long article as React children: headings, lists, quote, code, tables, figure, definition list. */
export const Article: Story = {};

/**
 * The same article from an HTML string. `sanitizedHtml` is inserted as-is; the caller is responsible
 * for sanitizing it.
 */
export const FromSanitizedHtml: Story = {
  args: { children: undefined, sanitizedHtml: articleHtml },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('h2, h3').length).toBeGreaterThanOrEqual(8);
  },
};

export const Short: Story = {
  args: { children: shortArticleNode },
};

export const Large: Story = {
  args: { size: 'large', children: shortArticleNode },
};

export const OnSubtleSection: Story = {
  parameters: { surface: 'subtle' },
};

export const OnInverseSection: Story = {
  parameters: { surface: 'inverse' },
};
