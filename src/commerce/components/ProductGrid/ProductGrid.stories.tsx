import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { catalog, catalog48 } from '../../fixtures';
import type { Product } from '../../types/product';
import { ProductCard } from '../ProductCard';
import { ProductGrid } from './ProductGrid';

const grid = (products: Product[]) => (
  <ProductGrid count={products.length}>
    {products.map((p) => (
      <ProductCard key={p.id} product={p} href={`/products/${p.handle}`} />
    ))}
  </ProductGrid>
);

const meta = { title: 'Commerce/ProductGrid', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const One: Story = { render: () => grid(catalog.products.slice(0, 1)) };
export const Two: Story = { render: () => grid(catalog.products.slice(0, 2)) };
export const Five: Story = { render: () => grid(catalog.products.slice(0, 5)) };
export const TwentyFour: Story = {
  tags: ['vrt-mobile'],
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => grid(catalog48.slice(0, 24)),
  play: async ({ canvasElement }) => expect(within(canvasElement).getByRole('status')).toHaveTextContent('24 products'),
};
export const Loading: Story = {
  render: () => <ProductGrid count={0} loading skeletonCount={4} />,
  play: async ({ canvasElement }) => expect(within(canvasElement).getByRole('list', { name: 'Products' })).toHaveAttribute('aria-busy', 'true'),
};
export const EmptyCollection: Story = { render: () => <ProductGrid count={0} empty={<EmptyState title="This collection is empty" message="New products are on their way." action={{ label: 'Browse all products', href: '/shop' }} />} /> };
export const NoMatches: Story = {
  render: () => (
    <ProductGrid count={0} empty={<EmptyState title="No products match your filters" message="Try removing a filter.">{<Button variant="secondary">Clear all filters</Button>}</EmptyState>} />
  ),
};
