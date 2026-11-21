import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, within } from 'storybook/test';
import { catalog, catalog48, listingCollections } from '../../fixtures';
import { computeFacets, emptyFilters, parseFilters, type FilterState } from '../../logic/browse';
import type { Product } from '../../types/product';
import { FilterPanel } from './FilterPanel';

function Live({ products, initial = emptyFilters() }: { products: Product[]; initial?: FilterState }) {
  const [value, setValue] = useState(initial);
  return (
    <div style={{ maxInlineSize: '18rem' }}>
      <FilterPanel facets={computeFacets(products, value)} value={value} onChange={setValue} action="/shop" />
    </div>
  );
}

const meta = { title: 'Commerce/FilterPanel', tags: ['vrt-mobile'], parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** A plain GET form with named fields (works without JavaScript). */
export const Default: Story = {
  render: () => (
    <div style={{ maxInlineSize: '18rem' }}>
      <FilterPanel facets={computeFacets(catalog.products, emptyFilters())} value={emptyFilters()} action="/shop" sort="price-asc" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    await expect(form).toHaveAttribute('method', 'get');
    await expect(form).toHaveAttribute('action', '/shop');
    const names = new Set([...form.querySelectorAll<HTMLInputElement>('input[name]')].map((i) => i.name));
    for (const name of ['kind', 'o.Size', 'o.Colour', 'tag', 'price_min', 'price_max', 'in_stock', 'on_sale', 'rating', 'sort']) await expect(names.has(name), name).toBe(true);
  },
};

export const ManySelected: Story = { render: () => <Live products={catalog.products} initial={parseFilters('kind=physical&o.Size=M&o.Colour=Moss&o.Colour=Sand&in_stock=1&rating=4')} /> };

/** Zero-count values stay visible but disabled. */
export const ZeroCounts: Story = {
  render: () => <Live products={catalog.products} initial={parseFilters('kind=digital')} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('checkbox', { name: 'Moss (0)' })).toBeDisabled();
    await expect(canvas.getByRole('checkbox', { name: /Digital \(3\)/ })).toBeChecked();
  },
};

/** Groups with more than six values get a native "Show more" disclosure. */
export const LongGroup: Story = { render: () => <Live products={catalog48} initial={parseFilters('tag=gift')} /> };

export const PriceError: Story = {
  render: () => <Live products={listingCollections.base.products} initial={parseFilters('price_min=80&price_max=20')} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent('The minimum price is higher than the maximum.');
  },
};
