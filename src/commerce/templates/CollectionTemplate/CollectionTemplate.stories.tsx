import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { chrome, collectionPage, filterQueries, subCollectionTiles } from '../../fixtures';
import { parseFilters } from '../../logic/browse';
import { expectHeadingOutline, LiveCollection } from '../../stories/browseStories';
import type { CollectionPage } from '../../types/pages';
import { CollectionTemplate } from './CollectionTemplate';

const render = (page: CollectionPage, loading = false) => <CollectionTemplate page={page} chrome={chrome} ctx={{ currentPath: '/shop', loading }} />;

const meta = {
  title: 'Commerce/Templates/Collection',
  tags: ['vrt-mobile'],
  parameters: { layout: 'fullscreen' },
  play: async ({ canvasElement }) => expectHeadingOutline(canvasElement),
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// Tags are written literally on each story (Storybook reads them statically; see check:story-tags).

/** Base catalogue with category tiles; filters are a GET form and links (no JavaScript needed). */
export const Default: Story = { tags: ['!vrt-mobile', 'vrt-full'], render: () => render(collectionPage('base', '', { subCollections: subCollectionTiles })) };

/** Size M and colour Moss: chips, counts and two matches. */
export const Filtered: Story = {
  tags: ['!vrt-mobile', 'vrt-full'],
  render: () => render(collectionPage('base', filterQueries.sizeAndColour)),
  play: async ({ canvasElement }) => {
    await expectHeadingOutline(canvasElement);
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: 'Remove filter: Colour Moss' })).toHaveAttribute('href', '/shop?o.Size=M');
    await expect(canvas.getByText('2 products', { selector: '[role="status"]' })).toBeVisible();
  },
};

export const EmptyCollection: Story = { tags: ['!vrt-mobile', 'vrt-full'], render: () => render(collectionPage('empty')) };
export const NoMatches: Story = { render: () => render(collectionPage('base', filterQueries.noMatches)) };
export const Loading: Story = { render: () => render(collectionPage('all'), true) };
export const OneProduct: Story = { render: () => render(collectionPage('oneProduct')) };

/** 48 products in load-more mode; "Load more" appends in place. */
export const FortyEightLoadMore: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => <LiveCollection collection="all" mode="load-more" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Showing 12 of 48 products')).toBeVisible();
    await userEvent.click(canvas.getByRole('link', { name: 'Load more products' }));
    await expect(canvas.getByText('Showing 24 of 48 products')).toBeVisible();
    window.scrollTo(0, 0);
  },
};

/** Narrow container: the Filters button opens the drawer; focus is trapped and returns on Escape. */
export const NarrowWithDrawer: Story = {
  tags: ['!vrt-mobile'],
  parameters: { vrt: { viewports: [375] } },
  render: () => <LiveCollection collection="base" initial={{ filters: parseFilters('kind=physical') }} />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Filters (1)' });
    if (!button.checkVisibility()) return; // wide: the sidebar is shown instead
    await userEvent.click(button);
    const dialog = await waitFor(() => within(document.body).getByRole('dialog', { name: 'Filters' }));
    await expect(dialog.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(button).toHaveFocus());
    await userEvent.click(button);
    await waitFor(() => expect(within(document.body).getByRole('dialog', { name: 'Filters' })).toBeVisible());
  },
};

/** Live filtering (pure logic): tick a filter, see chips and the new count, remove it again. */
export const ApplyFilters: Story = {
  parameters: { vrt: { viewports: [1280] } },
  render: () => <LiveCollection collection="base" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sidebar = canvas.getByRole('complementary', { name: 'Filters' });
    await userEvent.click(within(sidebar).getByRole('checkbox', { name: /^Digital/ }));
    await expect(canvas.getByText('3 products', { selector: '[role="status"]' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Remove filter: Digital' })).toBeVisible();
    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Sort by' }), 'price-desc');
    await expect(canvas.getAllByRole('article')[0]).toHaveTextContent('Garden design template bundle');
    await userEvent.click(canvas.getByRole('button', { name: 'Remove filter: Digital' }));
    await expect(canvas.getByText('19 products', { selector: '[role="status"]' })).toBeVisible();
    window.scrollTo(0, 0);
  },
};
