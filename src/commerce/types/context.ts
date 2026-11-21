import type { RenderContext } from '../../templates/types';
import type { FilterState, SortKey } from '../logic/browse';
import type { Selection } from '../logic/variants';
import type { Product, PurchaseOption, Variant } from './product';

/** What the host passes to the commerce templates, on top of the core RenderContext. All optional. */
export interface CommerceContext extends RenderContext {
  /** Product page URL for a product. Default "/products/<handle>". */
  productHref?: (product: Product) => string;
  /** Live filtering. Without it, filters, sort and chips are plain links and GET forms. */
  onListingChange?: (change: { filters: FilterState; sort: SortKey; page: number }) => void;
  /** Load-more mode: load the next batch in place. */
  onLoadMore?: () => void;
  /** Show skeletons in the product grid. */
  loading?: boolean;
  /** Quick add from product cards. */
  onQuickAdd?: (product: Product, variant: Variant) => void;
  /** Add to cart from the product page. May return a promise: the button shows loading, then success or error. */
  onAddToCart?: (item: { product: Product; variantId: string; quantity: number; purchaseOption: PurchaseOption }) => void | Promise<unknown>;
  onSelectionChange?: (selection: Selection) => void;
}

export const defaultProductHref = (product: Product) => `/products/${product.handle}`;
