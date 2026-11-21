/*
 * Page shapes for the commerce templates. They extend the core PageContent, so they fit the existing
 * templates registry (page.template = "collection" | "product-detail").
 */
import type { PageContent } from '../../content-types/blocks';
import type { BreadcrumbItem } from '../../content-types/navigation';
import type { ImageRef } from '../../content-types/shared';
import type { Facets, FilterState, SortKey } from '../logic/browse';
import type { CartTotals } from '../logic/cart';
import type { CartIssue, CartLineNote } from '../logic/cartLines';
import type { Selection } from '../logic/variants';
import type { Cart, ShippingMethod } from './cart';
import type { CheckoutErrors, CheckoutStepId, CheckoutValues } from './checkout';
import type { Order } from './order';
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

/** Links the cart, checkout and confirmation pages use. Defaults: "/shop", "/cart", "/checkout". */
export interface CommerceLinks {
  shop?: string;
  cart?: string;
  checkout?: string;
  /** Terms of sale, linked from the payment step. Default "/terms". */
  terms?: string;
  /** Order details page on the confirmation. Default "/account/orders/<number>". */
  order?: string;
}

/** The cart page. Totals come from computeCartTotals; the template does no pricing. */
export interface CartPage extends PageContent {
  template: 'cart';
  cart: Cart;
  totals: CartTotals;
  /** From getCartIssues. Blocking issues disable checkout. */
  issues: CartIssue[];
  /** Catalogue-aware notes per line id (getCartNotes). Default: notes from the line alone. */
  notes?: Record<string, CartLineNote[]>;
  /** "Complete your order" products. */
  crossSell?: Product[];
  /** `loading` shows a skeleton, `error` a page-level alert. */
  status?: 'idle' | 'loading' | 'error';
  /** Per-line update state while the host saves a change. */
  lineStatus?: Record<string, 'updating' | 'error'>;
  links?: CommerceLinks;
}

/** One checkout step. The host owns values, step and status; the template validates and calls back. */
export interface CheckoutPage extends PageContent {
  template: 'checkout';
  cart: Cart;
  totals: CartTotals;
  step: CheckoutStepId;
  values: CheckoutValues;
  /** Errors from the host (e.g. a server check), shown until the next continue. */
  errors?: CheckoutErrors;
  shippingMethods: ShippingMethod[];
  /** From getCartIssues: blocking issues send the customer back to the cart. */
  issues?: CartIssue[];
  notes?: Record<string, CartLineNote[]>;
  /** Placing the order. */
  status?: 'idle' | 'submitting' | 'error';
  /** Shown when status is `error`. */
  errorMessage?: string;
  links?: CommerceLinks;
}

/** The order confirmation. */
export interface OrderConfirmationPage extends PageContent {
  template: 'order-confirmation';
  order: Order;
  links?: CommerceLinks;
}
