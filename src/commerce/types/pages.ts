/*
 * Page shapes for the commerce templates. They extend the core PageContent, so they fit the existing
 * templates registry (page.template = "collection" | "product-detail").
 */
import type { PageContent } from '../../content-types/blocks';
import type { BreadcrumbItem } from '../../content-types/navigation';
import type { ImageRef } from '../../content-types/shared';
import type { Facets, FilterState, SortKey } from '../logic/browse';
import type { Selection } from '../logic/variants';
import type { Product, ProductReviewsData, PurchaseOption } from './product';

/** One page of a filtered, sorted collection. */
export interface CollectionListing {
  /** Products to show: this page (pages mode) or everything loaded so far (load-more mode). */
  products: Product[];
  /** Products matching the filters, across all pages. */
  total: number;
  /** Products per page. */
  perPage: number;
  sort: SortKey;
  filters: FilterState;
  /** Facet counts for the filter panel (computeFacets over the whole collection). */
  facets: Facets;
  /** `pages`: numbered pagination. `load-more`: a "Load more" button with a link fallback. */
  mode: 'pages' | 'load-more';
  /** 1-based page, total pages and the collection URL. */
  pagination: { currentPage: number; totalPages: number; basePath: string };
}

/** A collection (category) listing page. */
export interface CollectionPage extends PageContent {
  template: 'collection';
  collection: { title: string; description?: string; image?: ImageRef; breadcrumbs: BreadcrumbItem[]; productCount?: number };
  listing: CollectionListing;
  /** Child collections shown as tiles above the grid. */
  subCollections?: { title: string; href: string; productCount?: number; image?: ImageRef }[];
}

/** A product detail page. */
export interface ProductPage extends PageContent {
  template: 'product-detail';
  product: Product;
  reviews: ProductReviewsData;
  related: Product[];
  breadcrumbs?: BreadcrumbItem[];
  initialSelection?: Selection;
  initialPurchaseOption?: PurchaseOption;
}
