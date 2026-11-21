import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor, within } from 'storybook/test';
import { BlockRenderer, type ValidationIssue } from '../registry';
import { expectHeadingOutline, expectNoUnsafeLinks, fixturePage, SiteFrame } from './contentModel';

/**
 * Edge-case page fixtures. With `showErrors` (as in a CMS preview) blocks that cannot render show a
 * placeholder; without it they render nothing. Either way every problem reaches `onError`.
 */
const meta = {
  title: 'Content model/Edge cases',
  tags: ['vrt-mobile'],
  parameters: { layout: 'fullscreen' },
  args: { name: 'empty', showErrors: true, onError: fn() },
  render: ({ name, showErrors, onError }) => (
    <SiteFrame>
      <BlockRenderer blocks={fixturePage(name).blocks} showErrors={showErrors} onError={onError} />
    </SiteFrame>
  ),
} satisfies Meta<{ name: string; showErrors: boolean; onError: (issue: ValidationIssue) => void }>;

export default meta;
type Story = StoryObj<typeof meta>;

const reported = (onError: unknown) => (onError as ReturnType<typeof fn>).mock.calls.map(([issue]) => `${issue.blockId}:${issue.code}`);

export const EmptyPage: Story = {
  args: { name: 'empty' },
  play: async ({ canvasElement, args }) => {
    await expect(canvasElement.querySelector('main')?.children).toHaveLength(0);
    await expect(args.onError).not.toHaveBeenCalled();
  },
};

export const SingleBlock: Story = {
  args: { name: 'single-block' },
  play: async ({ canvasElement }) => expectHeadingOutline(canvasElement.querySelector('main')!),
};

export const AllBlocks: Story = {
  args: { name: 'all-blocks' },
  tags: ['!vrt-mobile', 'vrt-full'],
  play: async ({ canvasElement, args }) => {
    await expectHeadingOutline(canvasElement.querySelector('main')!);
    await expect(args.onError).not.toHaveBeenCalled();
  },
};

export const UnknownBlock: Story = {
  args: { name: 'unknown-block' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // The page around the unknown block still renders.
    await expect(canvas.getByRole('heading', { level: 1, name: 'A page with an unknown block' })).toBeVisible();
    await expect(canvas.getByText('Unknown block: carouselOfDoom')).toBeVisible();
    await waitFor(() => expect(reported(args.onError)).toEqual(['mystery:unknown-type']));
  },
};

export const UnknownBlockHidden: Story = {
  name: 'Unknown block (showErrors false)',
  args: { name: 'unknown-block', showErrors: false },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText(/Unknown block/)).toBeNull();
    await expect(canvasElement.querySelectorAll('main > section')).toHaveLength(2);
    await waitFor(() => expect(reported(args.onError)).toEqual(['mystery:unknown-type']));
  },
};

export const BrokenBlock: Story = {
  args: { name: 'broken-block' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText(/Block could not be rendered: (hero|ctaBanner)/)).toHaveLength(2);
    await waitFor(() => expect(reported(args.onError).sort()).toEqual(['broken-cta:missing-field', 'broken-hero:missing-field']));
    // The broken hero does not take the h1; the page header does.
    await expectHeadingOutline(canvasElement.querySelector('main')!);
  },
};

export const FortyBlocks: Story = {
  args: { name: 'forty-blocks' },
  play: async ({ canvasElement, args }) => {
    await expect(canvasElement.querySelectorAll('main > section')).toHaveLength(40);
    await expect(args.onError).not.toHaveBeenCalled();
  },
};

export const DuplicateIds: Story = {
  args: { name: 'duplicate-ids' },
  play: async ({ canvasElement, args }) => {
    // The second use of anchorId "numbers" is dropped, so the DOM id stays unique.
    await expect(canvasElement.querySelectorAll('#numbers')).toHaveLength(1);
    await waitFor(() => expect(reported(args.onError)).toEqual(['dup-cta:duplicate-id']));
  },
};

export const UnsafeLinks: Story = {
  args: { name: 'unsafe-link' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expectNoUnsafeLinks(canvasElement);
    // Inert text, not links.
    const inert = canvas.getByText('link that runs script');
    await expect(inert.closest('a[href]')).toBeNull();
    await expect(canvas.queryByRole('link', { name: /Run script/ })).toBeNull();
    await expect(canvas.getByRole('heading', { name: 'Cleaning up two years of books' }).querySelector('a')).toBeNull();
    // The safe link next to it still works.
    await expect(canvas.getByRole('link', { name: 'normal link' })).toHaveAttribute('href', '/pricing');
    await waitFor(() => expect(reported(args.onError).filter((r) => r.endsWith(':unsafe-href')).length).toBeGreaterThanOrEqual(4));
  },
};

export const LongText: Story = {
  args: { name: 'long-text' },
  play: async ({ canvasElement }) => {
    await expectHeadingOutline(canvasElement.querySelector('main')!);
    // Nothing overflows the viewport horizontally.
    await expect(canvasElement.ownerDocument.documentElement.scrollWidth).toBeLessThanOrEqual(canvasElement.ownerDocument.documentElement.clientWidth);
  },
};
