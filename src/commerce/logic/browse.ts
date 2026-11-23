/*
 * Catalogue browsing: price summaries, availability, filters (with a URL query format), facets,
 * sorting and pagination. Pure: no clock, no DOM, no network.
 *
 * URL query format (see docs/commerce-browsing.md), written in this key order with values sorted:
 *   q, kind, tag, o.<Option name> (option names sorted), price_min, price_max (whole currency units),
 *   in_stock=1, on_sale=1, rating, sort, page. Repeated keys carry multiple values (kind=digital&kind=physical),
 *   which is what a native GET form with checkboxes sends.
 */
import type { Money } from '../../content-types/money';
import type { BillingInterval, Product, ProductKind, StockInfo, Variant } from '../types/product';
import { percentOff, subscriptionUnitPrice } from './pricing';
import { isPurchasable } from './variants';

/** Product listing sort orders; also the `sort` URL parameter values (`featured` is the default and is omitted from URLs). */
export type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'rating' | 'title';
/** All sort keys in display order, for building a sort control and validating the `sort` parameter. */
export const sortKeys: readonly SortKey[] = ['featured', 'price-asc', 'price-desc', 'newest', 'rating', 'title'];
/** Human-readable label for each sort key, shown in the sort control. */
export const sortLabels: Record<SortKey, string> = {
  featured: 'Featured',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  newest: 'Newest',
  rating: 'Top rated',
  title: 'Name: A to Z',
};

const KINDS: readonly ProductKind[] = ['physical', 'digital', 'subscription'];
const MAX_MINOR = 100_000_000_00; // $100M: clamp for price inputs

/** The active catalog filters for a product listing; round-trips through the URL query with parseFilters and serializeFilters. */
export interface FilterState {
  kinds: ProductKind[];
  tags: string[];
  /** Minor units. */
  price?: { min?: number; max?: number };
  /** Option name → selected values. */
  options: Record<string, string[]>;
  availability: 'all' | 'in-stock';
  onSale: boolean;
  /** Whole stars 1-5. */
  minRating?: number;
  query?: string;
}

/** Returns a new FilterState with no filters set (all kinds, all availability, no sale or rating filter). */
export const emptyFilters = (): FilterState => ({ kinds: [], tags: [], options: {}, availability: 'all', onSale: false });

/* ---------- price and availability ---------- */

/** A product's price range and sale info as returned by getPriceSummary; money in minor units. */
export interface PriceSummary {
  min: Money;
  max: Money;
  hasRange: boolean;
  onSale: boolean;
  maxDiscountPercent: number;
  /** For subscription products: the interval of the lowest per-cycle price. */
  interval?: BillingInterval;
}

/**
 * Lowest and highest price over the variants. For kind `subscription`, prices are per cycle for each
 * subscription option (subscriptionUnitPrice) and `interval` is the cheapest option's interval.
 */
export function getPriceSummary(product: Product): PriceSummary {
  const candidates: { price: Money; interval?: BillingInterval }[] = [];
  for (const variant of product.variants) {
    if (product.kind === 'subscription') {
      for (const option of product.purchaseOptions) {
        if (option.type === 'subscription') candidates.push({ price: subscriptionUnitPrice(variant.price, option), interval: option.interval });
      }
    } else {
      candidates.push({ price: variant.price });
    }
  }
  if (candidates.length === 0) candidates.push({ price: { amount: 0, currency: 'USD' } });
  const sorted = [...candidates].sort((a, b) => a.price.amount - b.price.amount);
  const min = sorted[0]!;
  const max = sorted[sorted.length - 1]!;
  const discounts = product.variants.map((v) => percentOff(v.price, v.compareAtPrice));
  const maxDiscountPercent = Math.max(0, ...discounts);
  return { min: min.price, max: max.price, hasRange: min.price.amount !== max.price.amount, onSale: maxDiscountPercent > 0, maxDiscountPercent, ...(min.interval ? { interval: min.interval } : {}) };
}

/** Overall stock: in stock if any variant is; low stock if every purchasable variant is low; then pre-order, backorder, sold out. */
export function getProductAvailability(product: Product): StockInfo['status'] {
  const statuses = new Set(product.variants.map((v) => v.stock.status));
  for (const status of ['in-stock', 'low-stock', 'preorder', 'backorder'] as const) if (statuses.has(status)) return status;
  return 'out-of-stock';
}

/* ---------- query string ---------- */

const toInt = (value: string | null, min: number, max: number) => {
  if (value === null || value.trim() === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, Math.round(n)));
};
const toMinor = (value: string | null) => {
  if (value === null || value.trim() === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(MAX_MINOR, Math.max(0, Math.round(n * 100)));
};
const clean = (values: string[]) => [...new Set(values.map((v) => v.trim()).filter((v) => v && v.length <= 80))].sort();

/** Reads filters from a query string. Unknown or malformed parameters are ignored, numbers clamped, values de-duplicated. */
export function parseFilters(input: string | URLSearchParams): FilterState {
  const params = typeof input === 'string' ? new URLSearchParams(input.startsWith('?') ? input.slice(1) : input) : input;
  const state = emptyFilters();
  state.kinds = clean(params.getAll('kind')).filter((k): k is ProductKind => (KINDS as readonly string[]).includes(k));
  state.tags = clean(params.getAll('tag'));
  for (const key of new Set(params.keys())) {
    if (!key.startsWith('o.')) continue;
    const name = key.slice(2).trim();
    const values = clean(params.getAll(key));
    if (name && values.length) state.options[name] = values;
  }
  const min = toMinor(params.get('price_min'));
  const max = toMinor(params.get('price_max'));
  if (min !== undefined || max !== undefined) state.price = { ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}) };
  if (params.get('in_stock') === '1') state.availability = 'in-stock';
  if (params.get('on_sale') === '1') state.onSale = true;
  const rating = toInt(params.get('rating'), 1, 5);
  if (rating !== undefined) state.minRating = rating;
  const query = params.get('q')?.trim().slice(0, 100);
  if (query) state.query = query;
  return state;
}

/** Reads the `sort` parameter from a query string; returns `featured` when it is missing or not a known SortKey. */
export function parseSort(input: string | URLSearchParams): SortKey {
  const params = typeof input === 'string' ? new URLSearchParams(input.startsWith('?') ? input.slice(1) : input) : input;
  const sort = params.get('sort');
  return sortKeys.includes(sort as SortKey) ? (sort as SortKey) : 'featured';
}

/** Reads the 1-based `page` parameter from a query string, rounded and clamped to 1..10000; defaults to 1. */
export function parsePage(input: string | URLSearchParams): number {
  const params = typeof input === 'string' ? new URLSearchParams(input.startsWith('?') ? input.slice(1) : input) : input;
  return toInt(params.get('page'), 1, 10_000) ?? 1;
}

const major = (minor: number) => (minor % 100 === 0 ? String(minor / 100) : (minor / 100).toFixed(2));

/** Writes filters (plus optional sort and page) as a query string without "?". Defaults are omitted; order is stable. */
export function serializeFilters(state: FilterState, extra: { sort?: SortKey; page?: number } = {}): string {
  const params = new URLSearchParams();
  if (state.query) params.append('q', state.query);
  for (const kind of clean(state.kinds)) params.append('kind', kind);
  for (const tag of clean(state.tags)) params.append('tag', tag);
  for (const name of Object.keys(state.options).sort()) for (const value of clean(state.options[name] ?? [])) params.append(`o.${name}`, value);
  if (state.price?.min !== undefined) params.append('price_min', major(state.price.min));
  if (state.price?.max !== undefined) params.append('price_max', major(state.price.max));
  if (state.availability === 'in-stock') params.append('in_stock', '1');
  if (state.onSale) params.append('on_sale', '1');
  if (state.minRating) params.append('rating', String(state.minRating));
  if (extra.sort && extra.sort !== 'featured') params.append('sort', extra.sort);
  if (extra.page && extra.page > 1) params.append('page', String(extra.page));
  return params.toString();
}

/* ---------- filtering ---------- */

/** Variants matching the option selections (all options at once, on a single variant). */
function matchingVariants(product: Product, options: FilterState['options']): Variant[] {
  const entries = Object.entries(options).filter(([, values]) => values.length > 0);
  return product.variants.filter((variant) => entries.every(([name, values]) => values.includes(variant.optionValues[name] ?? '\u0000')));
}

function matches(product: Product, state: FilterState): boolean {
  if (state.kinds.length && !state.kinds.includes(product.kind)) return false;
  if (state.tags.length && !state.tags.some((tag) => product.tags?.includes(tag))) return false;
  if (state.onSale && !getPriceSummary(product).onSale) return false;
  if (state.minRating && (product.rating?.count ?? 0) === 0) return false;
  if (state.minRating && (product.rating?.average ?? 0) < state.minRating) return false;
  if (state.query) {
    const q = state.query.toLowerCase();
    const text = [product.title, product.summary, product.brand, ...(product.tags ?? [])].filter(Boolean).join(' ').toLowerCase();
    if (!text.includes(q)) return false;
  }
  let variants = matchingVariants(product, state.options);
  if (state.availability === 'in-stock') variants = variants.filter(isPurchasable);
  if (state.price) {
    const { min = 0, max = Number.MAX_SAFE_INTEGER } = state.price;
    const summary = getPriceSummary(product);
    // Subscriptions compare their per-cycle price; others any matching variant's price.
    if (product.kind === 'subscription') return summary.min.amount <= max && summary.max.amount >= min && variants.length > 0;
    variants = variants.filter((v) => v.price.amount >= min && v.price.amount <= max);
  }
  return variants.length > 0;
}

/**
 * Returns the products matching every filter in `state`, in their original order. Pure.
 *
 * Option, availability and price filters must all hold on a single variant; subscription products compare their per-cycle price range instead.
 */
export const applyFilters = (products: readonly Product[], state: FilterState): Product[] => products.filter((p) => matches(p, state));

/* ---------- sorting and pagination ---------- */

/** Stable sort; ties are broken by product id. `featured` keeps catalogue order. */
export function sortProducts(products: readonly Product[], sort: SortKey): Product[] {
  const order = new Map(products.map((p, i) => [p.id, i]));
  const byId = (a: Product, b: Product) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const price = (p: Product) => getPriceSummary(p).min.amount;
  const compare: Record<SortKey, (a: Product, b: Product) => number> = {
    featured: (a, b) => order.get(a.id)! - order.get(b.id)!,
    'price-asc': (a, b) => price(a) - price(b) || byId(a, b),
    'price-desc': (a, b) => price(b) - price(a) || byId(a, b),
    newest: (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || byId(a, b),
    rating: (a, b) => (b.rating?.average ?? 0) - (a.rating?.average ?? 0) || (b.rating?.count ?? 0) - (a.rating?.count ?? 0) || byId(a, b),
    title: (a, b) => a.title.localeCompare(b.title, 'en') || byId(a, b),
  };
  return [...products].sort(compare[sort]);
}

/** One page of items from paginate, with the clamped page number and 1-based item range for "Showing 1-24 of 80" text. */
export interface Page<T> {
  items: T[];
  /** Clamped to 1..totalPages. */
  page: number;
  totalPages: number;
  total: number;
  /** 1-based index of the first item shown (0 when empty). */
  start: number;
  end: number;
}

/** Returns one page of `items`. Page and page size are floored and clamped (page to 1..totalPages, size to at least 1), so out-of-range input never yields an empty middle page. Pure. */
export function paginate<T>(items: readonly T[], page: number, perPage: number): Page<T> {
  const size = Math.max(1, Math.floor(perPage) || 1);
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(totalPages, Math.max(1, Math.floor(page) || 1));
  const startIndex = (current - 1) * size;
  const slice = items.slice(startIndex, startIndex + size);
  return { items: slice, page: current, totalPages, total: items.length, start: slice.length ? startIndex + 1 : 0, end: startIndex + slice.length };
}

/* ---------- facets ---------- */

/** One selectable filter value with its label and the number of products it would match. */
export interface FacetValue {
  value: string;
  label: string;
  count: number;
}

/** Filter options with counts for a product listing, as returned by computeFacets; drives FilterPanel. */
export interface Facets {
  kinds: FacetValue[];
  tags: FacetValue[];
  options: { name: string; display?: 'buttons' | 'swatches' | 'select'; swatches?: Record<string, string>; values: FacetValue[] }[];
  inStock: number;
  onSale: number;
  ratings: FacetValue[];
  price: { min: Money; max: Money } | null;
}

const kindLabels: Record<ProductKind, string> = { physical: 'Physical', digital: 'Digital', subscription: 'Subscription' };

/** Lowest and highest variant price across products (null for none). */
export function priceBounds(products: readonly Product[]): { min: Money; max: Money } | null {
  const prices = products.flatMap((p) => p.variants.map((v) => v.price));
  if (prices.length === 0) return null;
  const sorted = [...prices].sort((a, b) => a.amount - b.amount);
  return { min: sorted[0]!, max: sorted[sorted.length - 1]! };
}

/**
 * Disjunctive facets: each group's counts apply every other selected filter but ignore that group's
 * own selection, so choosing "Blue" does not hide the count for "Red".
 */
export function computeFacets(products: readonly Product[], state: FilterState): Facets {
  const count = (without: Partial<FilterState>, test: (p: Product) => boolean) => applyFilters(products, { ...state, ...without }).filter(test).length;

  const kinds = KINDS.filter((kind) => products.some((p) => p.kind === kind)).map((kind) => ({ value: kind, label: kindLabels[kind], count: count({ kinds: [] }, (p) => p.kind === kind) }));
  const tagValues = [...new Set(products.flatMap((p) => p.tags ?? []))].sort();
  const tags = tagValues.map((tag) => ({ value: tag, label: tag, count: count({ tags: [] }, (p) => !!p.tags?.includes(tag)) }));

  const optionMeta = new Map<string, { values: string[]; display?: Facets['options'][number]['display']; swatches?: Record<string, string> }>();
  for (const product of products) {
    for (const option of product.options) {
      const entry = optionMeta.get(option.name) ?? { values: [], display: option.display, swatches: {} };
      for (const value of option.values) if (!entry.values.includes(value)) entry.values.push(value);
      entry.display ??= option.display;
      Object.assign(entry.swatches!, option.swatches);
      optionMeta.set(option.name, entry);
    }
  }
  const options = [...optionMeta.entries()].map(([name, meta]) => {
    const others = { ...state.options };
    delete others[name];
    return {
      name,
      ...(meta.display ? { display: meta.display } : {}),
      ...(meta.swatches && Object.keys(meta.swatches).length ? { swatches: meta.swatches } : {}),
      values: meta.values.map((value) => ({ value, label: value, count: count({ options: { ...others, [name]: [value] } }, () => true) })),
    };
  });

  const ratings = [4, 3, 2, 1].map((stars) => ({ value: String(stars), label: `${stars} ${stars === 1 ? 'star' : 'stars'} and up`, count: count({ minRating: stars }, () => true) }));
  return {
    kinds,
    tags,
    options,
    inStock: count({ availability: 'in-stock' }, () => true),
    onSale: count({ onSale: true }, () => true),
    ratings,
    price: priceBounds(applyFilters(products, { ...state, price: undefined })),
  };
}

/* ---------- active filter chips ---------- */

/** One active filter rendered as a removable chip (see describeFilters and ActiveFilters). */
export interface ActiveFilter {
  /** Stable id used by removeFilter. */
  id: string;
  label: string;
  group: string;
  /** Link that removes this filter, when a base href is given. */
  removeHref?: string;
}

/** The state without one active filter (by ActiveFilter id). */
export function removeFilter(state: FilterState, id: string): FilterState {
  const [group, ...rest] = id.split(':');
  const value = rest.join(':');
  const next: FilterState = { ...state, kinds: [...state.kinds], tags: [...state.tags], options: { ...state.options } };
  if (group === 'kind') next.kinds = next.kinds.filter((k) => k !== value);
  if (group === 'tag') next.tags = next.tags.filter((t) => t !== value);
  if (group === 'option') {
    const [name, optionValue] = value.split('=');
    next.options[name!] = (next.options[name!] ?? []).filter((v) => v !== optionValue);
    if (next.options[name!]!.length === 0) delete next.options[name!];
  }
  if (group === 'price') delete next.price;
  if (group === 'availability') next.availability = 'all';
  if (group === 'sale') next.onSale = false;
  if (group === 'rating') delete next.minRating;
  if (group === 'query') delete next.query;
  return next;
}

/**
 * One chip per active filter, in serialization order. With `baseHref`, each chip gets a link to the same
 * page without it (sort is kept).
 */
export function describeFilters(state: FilterState, options: { baseHref?: string; sort?: SortKey; formatPrice?: (minor: number) => string } = {}): ActiveFilter[] {
  const price = options.formatPrice ?? ((minor: number) => `$${major(minor)}`);
  const chips: Omit<ActiveFilter, 'removeHref'>[] = [];
  if (state.query) chips.push({ id: 'query:', label: `Search: “${state.query}”`, group: 'Search' });
  for (const kind of clean(state.kinds)) chips.push({ id: `kind:${kind}`, label: kindLabels[kind as ProductKind], group: 'Type' });
  for (const tag of clean(state.tags)) chips.push({ id: `tag:${tag}`, label: tag, group: 'Tag' });
  for (const name of Object.keys(state.options).sort()) for (const value of clean(state.options[name] ?? [])) chips.push({ id: `option:${name}=${value}`, label: `${name} ${value}`, group: name });
  if (state.price && (state.price.min !== undefined || state.price.max !== undefined)) {
    const { min, max } = state.price;
    const label = min !== undefined && max !== undefined ? `${price(min)} to ${price(max)}` : min !== undefined ? `From ${price(min)}` : `Up to ${price(max!)}`;
    chips.push({ id: 'price:', label, group: 'Price' });
  }
  if (state.availability === 'in-stock') chips.push({ id: 'availability:', label: 'In stock only', group: 'Availability' });
  if (state.onSale) chips.push({ id: 'sale:', label: 'On sale', group: 'Sale' });
  if (state.minRating) chips.push({ id: 'rating:', label: `${state.minRating} ${state.minRating === 1 ? 'star' : 'stars'} and up`, group: 'Rating' });
  if (!options.baseHref) return chips;
  return chips.map((chip) => {
    const query = serializeFilters(removeFilter(state, chip.id), { sort: options.sort });
    return { ...chip, removeHref: query ? `${options.baseHref}?${query}` : options.baseHref! };
  });
}

/** True when any filter is set. */
export const hasActiveFilters = (state: FilterState) => describeFilters(state).length > 0;
