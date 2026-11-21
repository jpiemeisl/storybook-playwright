import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { catalog } from '../../fixtures';
import { applyFilters, computeFacets, describeFilters, emptyFilters, parseFilters, removeFilter } from '../../logic/browse';
import { ActiveFilters } from '../ActiveFilters';
import { FilterPanel } from '../FilterPanel';
import { LoadMore } from '../LoadMore';
import { SortSelect } from '../SortSelect';
import { FilterDrawer } from './FilterDrawer';

function Drawer() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(parseFilters('kind=physical&on_sale=1'));
  return (
    <FilterDrawer open={open} onOpenChange={setOpen} activeCount={describeFilters(value).length} resultCount={applyFilters(catalog.products, value).length} onClear={() => setValue(emptyFilters())}>
      <FilterPanel facets={computeFacets(catalog.products, value)} value={value} onChange={setValue} />
    </FilterDrawer>
  );
}

const meta = { title: 'Commerce/FilterDrawer' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = { render: () => <Drawer /> };

/** Opens as a modal drawer: focus moves inside, Escape closes it and focus returns to the button. */
export const Open: Story = {
  parameters: { vrt: { viewports: [375, 1280] } },
  render: () => <Drawer />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Filters (2)' });
    await userEvent.click(button);
    const dialog = await waitFor(() => within(document.body).getByRole('dialog', { name: 'Filters' }));
    await expect(dialog).toBeVisible();
    await expect(dialog.contains(document.activeElement)).toBe(true);
    await expect(within(dialog).getByRole('button', { name: 'Show 2 results' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(button).toHaveFocus());
    await userEvent.click(button);
    await waitFor(() => expect(within(document.body).getByRole('dialog', { name: 'Filters' })).toBeVisible());
  },
};

/** Chips as buttons (live) and as links (no JavaScript); removals are announced. */
export const ActiveFilterChips: Story = {
  render: () => {
    function Chips() {
      const [value, setValue] = useState(parseFilters('kind=digital&o.Size=M&price_min=20&price_max=50&on_sale=1'));
      return (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <ActiveFilters filters={describeFilters(value)} onRemove={(chip) => setValue(removeFilter(value, chip.id))} onClear={() => setValue(emptyFilters())} />
          <ActiveFilters filters={describeFilters(parseFilters('o.Colour=Moss&rating=4'), { baseHref: '/shop' })} clearHref="/shop" />
        </div>
      );
    }
    return <Chips />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Remove filter: Size M' }));
    await expect(canvas.queryByRole('button', { name: 'Remove filter: Size M' })).toBeNull();
    await expect(canvas.getAllByRole('status')[0]).toHaveTextContent('Removed filter: Size M');
    await expect(canvas.getByRole('link', { name: 'Remove filter: Colour Moss' })).toHaveAttribute('href', '/shop?rating=4');
  },
};

export const SortAndLoadMore: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem', maxInlineSize: '24rem' }}>
      <SortSelect value="featured" onChange={() => {}} />
      <LoadMore shown={12} total={48} href="/shop?page=2" />
      <LoadMore shown={24} total={48} href="/shop?page=3" loading />
      <LoadMore shown={48} total={48} href="/shop?page=5" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Sort by' }), 'price-asc');
    await expect(canvas.getAllByRole('status')[0]).toHaveTextContent('Sorted by price: low to high');
    await expect(canvas.getAllByRole('progressbar')[0]).toHaveAttribute('aria-valuenow', '12');
  },
};

