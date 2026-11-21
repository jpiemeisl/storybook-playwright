import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Grid } from '../../../components/Grid';
import { calendar, candle, catalog, club, diningTable, guide, lamp, longTitle, mug, noImages, plannerApp, seedPacket, socks, tee, tote } from '../../fixtures';
import { CollectionCard } from '../CollectionCard';
import { ProductCard } from './ProductCard';

const href = (handle: string) => `/products/${handle}`;
const cards = [mug, tee, tote, candle, lamp, guide, club, plannerApp, calendar, longTitle, noImages, diningTable, seedPacket, socks];

const meta = {
  title: 'Commerce/ProductCard',
  tags: ['vrt-mobile'],
  parameters: { layout: 'padded', vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  args: { onQuickAdd: fn() },
} satisfies Meta<{ onQuickAdd: () => void }>;

export default meta;
type Story = StoryObj<{ onQuickAdd: () => void }>;

/** Every kind and state: sale, sold out, low stock, no image, long title, price extremes, with and without ratings, both quick actions. */
export const Matrix: Story = {
  render: (args) => (
    <Grid as="ul" columns={{ base: 2, md: 3, lg: 5 }} gap="md" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {cards.map((product, i) => (
        <li key={product.id}>
          <ProductCard product={product} href={href(product.handle)} quickAction={i % 3 === 0 ? 'add' : i % 3 === 1 ? 'choose-options' : undefined} onQuickAdd={args.onQuickAdd} showEmptyRating={product.id === 'prod-planner'} />
        </li>
      ))}
      <li>
        <ProductCard product={tote} href={href(tote.handle)} orientation="horizontal" />
      </li>
    </Grid>
  ),
  play: async ({ canvasElement, args }) => {
    // Each card: exactly one link, at most one separate button.
    for (const card of canvasElement.querySelectorAll('article')) {
      await expect(card.querySelectorAll('a')).toHaveLength(1);
      await expect(card.querySelectorAll('button').length).toBeLessThanOrEqual(1);
    }
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Add to cart: Stoneware mug' }));
    await expect(args.onQuickAdd).toHaveBeenCalledWith(mug, mug.variants[0]);
  },
};

/** Category tiles (CollectionCard). */
export const CollectionTiles: Story = {
  tags: ['!vrt-mobile'],
  parameters: { vrt: undefined },
  render: () => (
    <Grid as="ul" columns={{ base: 2, md: 3 }} gap="md" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {catalog.collections.map((c) => (
        <li key={c.id}>
          <CollectionCard title={c.title} href={`/shop/${c.handle}`} productCount={c.productIds.length} image={catalog.products.find((p) => p.id === c.productIds[0])?.images[0]} />
        </li>
      ))}
    </Grid>
  ),
};
