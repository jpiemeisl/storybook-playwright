import { describe, expect, it } from 'vitest';
import { catalog, club, coffee, diningTable, lamp, plannerApp, seedPacket, socks, stool, tee, tote, candle, kettle, mug } from '../fixtures';
import type { Product } from '../types/product';
import {
  applyFilters,
  computeFacets,
  describeFilters,
  emptyFilters,
  getPriceSummary,
  getProductAvailability,
  paginate,
  parseFilters,
  parsePage,
  parseSort,
  priceBounds,
  removeFilter,
  serializeFilters,
  sortProducts,
  type FilterState,
} from './browse';

const products = catalog.products;
const ids = (list: Product[]) => list.map((p) => p.id);
const state = (patch: Partial<FilterState>): FilterState => ({ ...emptyFilters(), ...patch });

describe('getPriceSummary', () => {
  it('single price, ranges and sales', () => {
    expect(getPriceSummary(mug)).toMatchObject({ min: { amount: 2400 }, hasRange: false, onSale: false, maxDiscountPercent: 0 });
    expect(getPriceSummary(coffee)).toMatchObject({ min: { amount: 1400 }, max: { amount: 4600 }, hasRange: true });
    expect(getPriceSummary(tote)).toMatchObject({ onSale: true, maxDiscountPercent: 24 });
    expect(getPriceSummary(socks)).toMatchObject({ min: { amount: 2200 }, max: { amount: 2400 }, hasRange: true });
  });

  it('price extremes', () => {
    expect(getPriceSummary(seedPacket).min.amount).toBe(99);
    expect(getPriceSummary(diningTable)).toMatchObject({ min: { amount: 1249900 }, onSale: true, maxDiscountPercent: 16 });
  });

  it('subscriptions use per-cycle prices and report the cheapest interval', () => {
    expect(getPriceSummary(club)).toMatchObject({ min: { amount: 2000 }, max: { amount: 19200 }, interval: { unit: 'month', count: 1 } });
    expect(getPriceSummary(plannerApp)).toMatchObject({ min: { amount: 600 }, hasRange: false, interval: { unit: 'month', count: 1 } });
  });
});

describe('getProductAvailability', () => {
  it('aggregates variant stock', () => {
    expect(getProductAvailability(tee)).toBe('in-stock');
    expect(getProductAvailability(candle)).toBe('low-stock');
    expect(getProductAvailability(lamp)).toBe('out-of-stock');
    expect(getProductAvailability(stool)).toBe('backorder');
    expect(getProductAvailability(kettle)).toBe('preorder');
  });

  it('ranks the best variant status: low stock beats pre-order and backorder, sold out only when all are', () => {
    const withStatuses = (...stocks: Product['variants'][number]['stock'][]): Product => ({ ...tee, variants: stocks.map((stock, i) => ({ ...tee.variants[0]!, id: `v${i}`, stock })) });
    expect(getProductAvailability(withStatuses({ status: 'low-stock', quantity: 2 }, { status: 'preorder' }))).toBe('low-stock');
    expect(getProductAvailability(withStatuses({ status: 'backorder' }, { status: 'low-stock', quantity: 1 }))).toBe('low-stock');
    expect(getProductAvailability(withStatuses({ status: 'out-of-stock' }, { status: 'preorder' }))).toBe('preorder');
    expect(getProductAvailability(withStatuses({ status: 'out-of-stock' }, { status: 'out-of-stock' }))).toBe('out-of-stock');
  });
});

describe('parseFilters and serializeFilters', () => {
  it('round-trips with a stable key order and sorted values', () => {
    const query = 'q=mug&kind=physical&kind=digital&tag=kitchen&o.Size=M&o.Colour=Moss&o.Colour=Ink&price_min=10&price_max=49.50&in_stock=1&on_sale=1&rating=4';
    const parsed = parseFilters(query);
    expect(parsed).toEqual({
      query: 'mug',
      kinds: ['digital', 'physical'],
      tags: ['kitchen'],
      options: { Size: ['M'], Colour: ['Ink', 'Moss'] },
      price: { min: 1000, max: 4950 },
      availability: 'in-stock',
      onSale: true,
      minRating: 4,
    });
    const serialized = serializeFilters(parsed, { sort: 'price-asc', page: 2 });
    expect(serialized).toBe('q=mug&kind=digital&kind=physical&tag=kitchen&o.Colour=Ink&o.Colour=Moss&o.Size=M&price_min=10&price_max=49.50&in_stock=1&on_sale=1&rating=4&sort=price-asc&page=2');
    expect(parseFilters(serialized)).toEqual(parsed);
    expect(parseSort(serialized)).toBe('price-asc');
    expect(parsePage(serialized)).toBe(2);
  });

  it('omits defaults', () => {
    expect(serializeFilters(emptyFilters())).toBe('');
    expect(serializeFilters(emptyFilters(), { sort: 'featured', page: 1 })).toBe('');
  });

  it('ignores unknown and malformed params, clamps numbers and de-duplicates', () => {
    const parsed = parseFilters('?kind=digital&kind=digital&kind=spaceship&rating=99&price_min=-5&price_max=abc&in_stock=yes&on_sale=0&o.=x&o.Size=&tag=%20kitchen%20&tag=kitchen&utm_source=mail&page=-3&sort=cheapest');
    expect(parsed).toEqual({ kinds: ['digital'], tags: ['kitchen'], options: {}, price: { min: 0 }, availability: 'all', onSale: false, minRating: 5 });
    expect(parseSort('sort=cheapest')).toBe('featured');
    expect(parsePage('page=-3')).toBe(1);
    expect(parsePage('page=abc')).toBe(1);
  });

  it('accepts URLSearchParams', () => {
    expect(parseFilters(new URLSearchParams([['kind', 'digital']])).kinds).toEqual(['digital']);
  });
});

describe('applyFilters', () => {
  it('by kind, tag, sale, rating and query', () => {
    expect(ids(applyFilters(products, state({ kinds: ['digital'] })))).toEqual(['prod-guide', 'prod-bundle', 'prod-calendar']);
    expect(ids(applyFilters(products, state({ tags: ['clothing'] })))).toEqual(['prod-tee']);
    expect(ids(applyFilters(products, state({ onSale: true })))).toEqual(['prod-tote', 'prod-table']);
    expect(applyFilters(products, state({ minRating: 4.5 })).every((p) => (p.rating?.average ?? 0) >= 4.5)).toBe(true);
    expect(ids(applyFilters(products, state({ query: 'KETTLE' })))).toEqual(['prod-kettle']);
  });

  it('option selections must match one variant; in-stock excludes sold-out combinations', () => {
    expect(ids(applyFilters(products, state({ options: { Size: ['M'], Colour: ['Moss'] } })))).toEqual(['prod-tee', 'prod-socks']);
    expect(ids(applyFilters([tee], state({ options: { Size: ['XL'] }, availability: 'in-stock' })))).toEqual([]);
    expect(ids(applyFilters([tee], state({ options: { Size: ['XL'] } })))).toEqual(['prod-tee']);
  });

  it('price range in minor units, including extremes', () => {
    expect(ids(applyFilters(products, state({ price: { max: 100 } })))).toEqual(['prod-calendar', 'prod-seed-packet']);
    expect(ids(applyFilters(products, state({ price: { min: 1_000_000 } })))).toEqual(['prod-table']);
  });

  it('empty catalogue and all filtered out', () => {
    expect(applyFilters([], state({ kinds: ['digital'] }))).toEqual([]);
    expect(applyFilters(products, state({ query: 'no such thing' }))).toEqual([]);
  });

  it('40-variant product', () => {
    expect(ids(applyFilters([socks], state({ options: { Size: ['4XL'], Colour: ['Fog'] }, availability: 'in-stock' })))).toEqual(['prod-socks']);
  });
});

describe('sortProducts', () => {
  it('sorts by price both ways with id tie-breaks', () => {
    const asc = sortProducts(products, 'price-asc');
    expect(asc[0]!.id).toBe('prod-calendar');
    expect(asc.at(-1)!.id).toBe('prod-table');
    expect(sortProducts(products, 'price-desc')[0]!.id).toBe('prod-table');
    const tie = [{ ...mug, id: 'b' }, { ...mug, id: 'a' }];
    expect(ids(sortProducts(tie, 'price-asc'))).toEqual(['a', 'b']);
  });

  it('featured keeps catalogue order; title, rating and newest', () => {
    expect(ids(sortProducts(products, 'featured'))).toEqual(ids(products));
    expect(sortProducts(products, 'title')[0]!.title).toBe('Basil seed packet');
    expect(sortProducts(products, 'rating')[0]!.id).toBe('prod-tote'); // 4.8 with 4,000 reviews
    const dated = [{ ...mug, id: 'old', createdAt: '2025-01-01' }, { ...mug, id: 'new', createdAt: '2026-03-01' }, { ...mug, id: 'none', createdAt: undefined }];
    expect(ids(sortProducts(dated, 'newest'))).toEqual(['new', 'old', 'none']);
  });

  it('does not mutate its input', () => {
    const copy = [...products];
    sortProducts(products, 'title');
    expect(products).toEqual(copy);
  });
});

describe('paginate', () => {
  it('clamps the page and reports the range', () => {
    const items = Array.from({ length: 48 }, (_, i) => i);
    expect(paginate(items, 2, 12)).toMatchObject({ page: 2, totalPages: 4, start: 13, end: 24, total: 48 });
    expect(paginate(items, 99, 12)).toMatchObject({ page: 4, start: 37, end: 48 });
    expect(paginate(items, -1, 12).page).toBe(1);
    expect(paginate([], 3, 12)).toMatchObject({ items: [], page: 1, totalPages: 1, start: 0, end: 0 });
    expect(paginate(items, 1, 0).items).toHaveLength(1);
  });
});

describe('computeFacets', () => {
  it('counts kinds disjunctively', () => {
    const facets = computeFacets(products, state({ kinds: ['digital'] }));
    expect(facets.kinds).toEqual([
      { value: 'physical', label: 'Physical', count: 13 },
      { value: 'digital', label: 'Digital', count: 3 },
      { value: 'subscription', label: 'Subscription', count: 3 },
    ]);
  });

  it('option counts ignore their own selection but apply the others', () => {
    const facets = computeFacets(products, state({ options: { Colour: ['Moss'] } }));
    const colour = facets.options.find((o) => o.name === 'Colour')!;
    expect(colour.values.find((v) => v.value === 'Sand')!.count).toBe(2); // tee and socks, despite Moss selected
    const size = facets.options.find((o) => o.name === 'Size')!;
    expect(size.values.find((v) => v.value === 'XXL')!.count).toBe(0);
    expect(size.values.find((v) => v.value === '250 g')!.count).toBe(0); // coffee has no Colour
  });

  it('price bounds and empty catalogue', () => {
    expect(priceBounds(products)).toEqual({ min: { amount: 0, currency: 'USD' }, max: { amount: 1249900, currency: 'USD' } });
    expect(priceBounds([])).toBeNull();
    // Same basis as the price filter: subscriptions use their per-cycle prices.
    const subs = products.filter((p) => p.kind === 'subscription');
    const bounds = priceBounds(subs)!;
    expect(bounds.min.amount).toBe(Math.min(...subs.map((p) => getPriceSummary(p).min.amount)));
    expect(bounds.max.amount).toBe(Math.max(...subs.map((p) => getPriceSummary(p).max.amount)));
    expect(applyFilters(subs, state({ price: { min: bounds.min.amount, max: bounds.max.amount } }))).toHaveLength(subs.length);
    expect(applyFilters(subs, state({ price: { min: bounds.max.amount + 1 } }))).toHaveLength(0);
    expect(computeFacets([], emptyFilters())).toMatchObject({ kinds: [], tags: [], options: [], inStock: 0, price: null });
  });
});

describe('describeFilters and removeFilter', () => {
  const s = state({ kinds: ['digital'], options: { Size: ['M'] }, price: { min: 2000, max: 5000 }, onSale: true, minRating: 4, query: 'mug' });

  it('one chip per filter with remove links that keep the sort', () => {
    const chips = describeFilters(s, { baseHref: '/shop/all', sort: 'price-asc' });
    expect(chips.map((c) => c.label)).toEqual(['Search: “mug”', 'Digital', 'Size M', '$20 to $50', 'On sale', '4 stars and up']);
    expect(chips.find((c) => c.id === 'option:Size=M')!.removeHref).toBe('/shop/all?q=mug&kind=digital&price_min=20&price_max=50&on_sale=1&rating=4&sort=price-asc');
    expect(describeFilters(state({ kinds: ['digital'] }), { baseHref: '/shop' })[0]!.removeHref).toBe('/shop');
  });

  it('removeFilter drops exactly one filter', () => {
    expect(removeFilter(s, 'option:Size=M').options).toEqual({});
    expect(removeFilter(s, 'price:').price).toBeUndefined();
    expect(removeFilter(s, 'kind:digital').kinds).toEqual([]);
    expect(describeFilters(emptyFilters())).toEqual([]);
  });

  it('removeFilter keeps option values that contain "="', () => {
    const withEquals = state({ options: { Fit: ['a=b=c', 'plain'] } });
    const chip = describeFilters(withEquals).find((c) => c.label === 'Fit a=b=c')!;
    expect(chip.id).toBe('option:Fit=a=b=c');
    expect(removeFilter(withEquals, chip.id).options).toEqual({ Fit: ['plain'] });
    expect(removeFilter(state({ options: { Fit: ['a=b'] } }), 'option:Fit=a=b').options).toEqual({});
  });
});
