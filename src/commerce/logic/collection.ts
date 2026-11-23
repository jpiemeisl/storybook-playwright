/*
 * Builds a collection listing from a full product list: filter, sort, facet and paginate. Pure: a host
 * with a backend would compute the same shape on its server.
 */
import type { Product } from '../types/product';
import type { CollectionListing } from '../types/pages';
import { applyFilters, computeFacets, paginate, sortProducts, type FilterState, type SortKey } from './browse';

/** Parameters for buildCollectionListing: filters, sort, page, page size, paging mode and the base path for page links. */
export interface ListingRequest {
  filters: FilterState;
  sort?: SortKey;
  page?: number;
  perPage?: number;
  mode?: CollectionListing['mode'];
  basePath: string;
}

/** Load-more mode returns every product up to the requested page; pages mode returns just that page. */
export function buildCollectionListing(products: readonly Product[], request: ListingRequest): CollectionListing {
  const { filters, sort = 'featured', page = 1, perPage = 12, mode = 'pages', basePath } = request;
  const matching = sortProducts(applyFilters(products, filters), sort);
  const current = paginate(matching, page, perPage);
  return {
    products: mode === 'load-more' ? matching.slice(0, current.end) : current.items,
    total: matching.length,
    perPage,
    sort,
    filters,
    facets: computeFacets(products, filters),
    mode,
    pagination: { currentPage: current.page, totalPages: current.totalPages, basePath },
  };
}
