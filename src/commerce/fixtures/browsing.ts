/*
 * Browsing fixtures: reviews data, listing collections, a deterministic 48-product catalogue, filter
 * query strings and ready-made template pages. No randomness at runtime: the catalogue comes from a
 * seeded generator, so every run (and every screenshot) is identical.
 */
import type { SiteChrome } from '../../content-types/chrome';
import chromeJson from '../../fixtures/chrome/default.json';
import { emptyFilters, getPriceSummary, parseFilters, parsePage, parseSort } from '../logic/browse';
import { buildCollectionListing } from '../logic/collection';
import { summarizeReviews } from '../logic/reviews';
import type { CollectionPage, ProductPage } from '../types/pages';
import type { Product, ProductReviewsData } from '../types/product';
import { catalog } from './catalog';
import { reviewsForty, reviewsNone, reviewsThree } from './reviews';

export const chrome = chromeJson as SiteChrome;

export const reviewsData: Record<'none' | 'three' | 'forty', ProductReviewsData> = {
  none: { summary: summarizeReviews(reviewsNone), reviews: reviewsNone },
  three: { summary: summarizeReviews(reviewsThree), reviews: reviewsThree },
  forty: { summary: summarizeReviews(reviewsForty), reviews: reviewsForty },
};

/** Small deterministic PRNG (mulberry32). */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const editions = ['Fern', 'Slate', 'Clay', 'Linen', 'Pine', 'Dune', 'Moss', 'Rye'];
const tagPool = ['kitchen', 'garden', 'gift', 'new', 'bestseller'];

/** 48 products built from the base catalogue with unique ids, handles and titles; prices and tags vary by a fixed seed. */
export function generateCatalog(count = 48, seed = 20260321): Product[] {
  const random = seeded(seed);
  const base = catalog.products.filter((p) => p.kind !== 'subscription' && p.variants.length <= 15 && p.images.length > 0);
  return Array.from({ length: count }, (_, i) => {
    const source = base[i % base.length]!;
    const edition = editions[Math.floor(i / base.length) % editions.length]!;
    const factor = 0.8 + Math.round(random() * 8) / 10; // 0.8 to 1.6 in 0.1 steps
    const onSale = random() < 0.2;
    const price = (amount: number) => Math.max(amount === 0 ? 0 : 99, Math.round((amount * factor) / 100) * 100 - (amount === 0 ? 0 : 1));
    return {
      ...source,
      id: `${source.id}-${i + 1}`,
      handle: `${source.handle}-${edition.toLowerCase()}-${i + 1}`,
      title: `${source.title}, ${edition} edition`,
      tags: [...new Set([...(source.tags ?? []), tagPool[i % tagPool.length]!])],
      createdAt: `2026-0${1 + (i % 3)}-${String(1 + (i % 28)).padStart(2, '0')}`,
      variants: source.variants.map((v) => {
        const amount = price(v.price.amount);
        return { ...v, price: { ...v.price, amount }, ...(onSale && amount > 0 ? { compareAtPrice: { ...v.price, amount: amount + Math.max(100, Math.round(amount * 0.25)) } } : v.compareAtPrice ? { compareAtPrice: { ...v.price, amount: amount + 500 } } : {}) };
      }),
      rating: { average: Math.round((3 + random() * 2) * 10) / 10, count: Math.floor(random() * 300) },
    };
  });
}

export const catalog48 = generateCatalog();

/** Listing collections: rules over the base catalogue (plus the generated one for "all"). */
export const listingCollections = {
  all: { title: 'All products', products: catalog48, basePath: '/shop/all' },
  onSale: { title: 'On sale', products: catalog.products.filter((p) => getPriceSummary(p).onSale), basePath: '/shop/sale' },
  digital: { title: 'Digital downloads', products: catalog.products.filter((p) => p.kind === 'digital'), basePath: '/shop/digital' },
  subscriptions: { title: 'Subscriptions', products: catalog.products.filter((p) => p.kind === 'subscription'), basePath: '/shop/subscriptions' },
  empty: { title: 'Gift cards', products: [] as Product[], basePath: '/shop/gift-cards' },
  oneProduct: { title: 'Kettles', products: catalog.products.filter((p) => p.id === 'prod-kettle'), basePath: '/shop/kettles' },
  base: { title: 'Fernhill Goods', products: catalog.products, basePath: '/shop' },
};
export type ListingCollectionKey = keyof typeof listingCollections;

/** Query strings for common filter cases. */
export const filterQueries = {
  sizeAndColour: 'o.Size=M&o.Colour=Moss',
  priceRange: 'price_min=20&price_max=50',
  digital: 'kind=digital',
  onSale: 'on_sale=1&sort=price-asc',
  noMatches: 'kind=digital&o.Size=XL',
  malformed: 'kind=spaceship&rating=99&price_min=abc&o.=x&page=-2&sort=cheapest',
};

/** A collection page from a listing collection and a query string. */
export function collectionPage(key: ListingCollectionKey, query = '', options: { mode?: 'pages' | 'load-more'; perPage?: number; subCollections?: CollectionPage['subCollections'] } = {}): CollectionPage {
  const source = listingCollections[key];
  const listing = buildCollectionListing(source.products, {
    filters: query ? parseFilters(query) : emptyFilters(),
    sort: parseSort(query),
    page: parsePage(query),
    perPage: options.perPage ?? 12,
    mode: options.mode ?? 'pages',
    basePath: source.basePath,
  });
  return {
    id: `collection-${key}`,
    slug: source.basePath.slice(1),
    template: 'collection',
    seo: { title: source.title },
    blocks: [],
    collection: { title: source.title, description: `${source.products.length} products from Fernhill Goods.`, breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: source.title }], productCount: source.products.length },
    listing,
    ...(options.subCollections ? { subCollections: options.subCollections } : {}),
  };
}

export const subCollectionTiles: CollectionPage['subCollections'] = catalog.collections.map((c) => ({ title: c.title, href: `/shop/${c.handle}`, productCount: c.productIds.length, image: catalog.products.find((p) => p.id === c.productIds[0])?.images[0] }));

/** A product page: the product, its reviews and related products from the same catalogue. */
export function productPage(product: Product, reviews: ProductReviewsData = reviewsData.three, extra: Partial<ProductPage> = {}): ProductPage {
  return {
    id: `page-${product.id}`,
    slug: `products/${product.handle}`,
    template: 'product-detail',
    seo: { title: product.title },
    blocks: [],
    product,
    reviews,
    related: catalog.products.filter((p) => p.id !== product.id && p.kind === product.kind).slice(0, 6),
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: product.title }],
    ...extra,
  };
}
