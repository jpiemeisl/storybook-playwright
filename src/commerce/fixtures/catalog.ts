import type { Catalog } from '../types/product';
import { products } from './products';

/** The fictional Fernhill Goods catalogue: all products plus three collections for listing pages. */
export const catalog: Catalog = {
  products,
  collections: [
    { id: 'col-home', handle: 'home-and-kitchen', title: 'Home and kitchen', description: 'Everyday things, made to last.', productIds: ['prod-mug', 'prod-candle', 'prod-lamp', 'prod-stool', 'prod-kettle', 'prod-coffee', 'prod-table'] },
    { id: 'col-garden', handle: 'garden', title: 'Garden', description: 'Tools, seeds and planters.', productIds: ['prod-seed-packet', 'prod-twine', 'prod-long', 'prod-tote', 'prod-socks', 'prod-tee'] },
    { id: 'col-digital', handle: 'digital-and-subscriptions', title: 'Digital and subscriptions', productIds: ['prod-guide', 'prod-bundle', 'prod-calendar', 'prod-seed-box', 'prod-club', 'prod-planner'] },
  ],
};

/** Product by id (throws for unknown ids: fixtures only). */
export function productById(id: string) {
  const product = catalog.products.find((p) => p.id === id);
  if (!product) throw new Error(`No product fixture ${id}`);
  return product;
}
