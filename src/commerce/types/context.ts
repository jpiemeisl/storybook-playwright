import type { RenderContext } from '../../templates/types';
import type { FilterState, SortKey } from '../logic/browse';
import type { Selection } from '../logic/variants';
import type { ReactNode } from 'react';
import type { PromoApplyResult } from '../components/PromoCodeInput';
import type { CartLine } from './cart';
import type { CheckoutStepId, CheckoutValues } from './checkout';
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

  // Cart, checkout and confirmation (Phase 11).
  /** Product page URL for a cart or order line. Default "/products/<productId>". */
  lineHref?: (line: CartLine) => string;
  onQuantityChange?: (lineId: string, quantity: number) => void;
  onRemoveLine?: (lineId: string) => void;
  /** Callback slot only: the library does not implement saving for later. */
  onSaveForLater?: (lineId: string) => void;
  /** Return (or resolve) { ok, message } to show the result. */
  onApplyPromo?: (code: string) => PromoApplyResult | Promise<PromoApplyResult> | void;
  onRemovePromo?: (code: string) => void;
  /** Without it, "Check out" is a link to links.checkout. */
  onCheckout?: () => void;
  /** Every change to the checkout values. */
  onCheckoutChange?: (values: CheckoutValues) => void;
  /** Move to a step (after a successful continue, or back to a completed step). Without it, steps are links. */
  onStepChange?: (step: CheckoutStepId) => void;
  onPlaceOrder?: () => void;
  /**
   * The payment provider's hosted fields, rendered under the selected payment method. SECURITY: never
   * build card inputs yourself; this library renders none. Use DemoPaymentFields only in demos.
   */
  paymentFields?: ReactNode;
}

export const defaultProductHref = (product: Product) => `/products/${product.handle}`;
export const defaultLineHref = (line: CartLine) => `/products/${line.productId}`;
