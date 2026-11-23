import type { RenderContext } from '../../templates/types';
import type { FilterState, SortKey } from '../logic/browse';
import type { Selection } from '../logic/variants';
import type { ReactNode } from 'react';
import type { PromoApplyResult } from '../components/PromoCodeInput';
import type { CartLine } from './cart';
import type { CheckoutStepId, CheckoutValues } from './checkout';
import type { AddressKind } from '../logic/account';
import type { ForgotPasswordValues, LoginValues, RegisterValues, ResetPasswordValues } from '../logic/authForms';
import type { SubscriptionActionRequest } from '../components/ManageSubscription';
import type { Invoice, SavedAddress } from './account';
import type { Order } from './order';
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
  /**
   * The product page's wishlist button was toggled: `saved` is the new state. Save or remove the product
   * in the host's wishlist. With `ProductPage.inWishlist` set, the button shows that state (controlled);
   * without it, the button keeps its own pressed state.
   */
  onWishlistToggle?: (product: Product, saved: boolean) => void;

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
   * Collect a billing address at checkout. Default true. Pass false when the payment provider collects
   * billing details itself: the checkout template then hides the billing address fields and validates
   * without them (the `collectBillingAddress` option of validateCheckoutStep and canEnterStep).
   */
  collectBillingAddress?: boolean;
  /**
   * The payment provider's hosted fields, rendered under the selected payment method. SECURITY: never
   * build card inputs yourself; this library renders none. Use DemoPaymentFields only in demos.
   */
  paymentFields?: ReactNode;

  // Auth and account (Phase 12). Without the auth callbacks, the forms POST to page.action natively.
  /** Hidden inputs for every auth form, e.g. a CSRF token. */
  formHiddenFields?: ReactNode;
  /**
   * Sign-in buttons for other providers (for example "Continue with ..."), shown at the top of the sign-in
   * form (LoginForm's `socialSlot`). Nothing by default.
   */
  socialSlot?: ReactNode;
  onLogin?: (values: LoginValues) => void;
  onRegister?: (values: RegisterValues) => void;
  onForgotPassword?: (values: ForgotPasswordValues) => void;
  onResetPassword?: (values: ResetPasswordValues) => void;
  onSignOut?: () => void;
  /** Every subscription action (pause, resume, change plan, cancel, undo, reactivate, update payment). */
  onSubscriptionAction?: (subscriptionId: string, request: SubscriptionActionRequest) => void;
  onRetryInvoice?: (invoice: Invoice) => void;
  /** "Buy again" on an order. A callback only. */
  onReorder?: (order: Order) => void;
  /**
   * Add or update a saved address. Without it, the address book hides "Add address" and "Edit". Report
   * the outcome of async saves through `AccountAddressesPage.status`.
   */
  onSaveAddress?: (address: Omit<SavedAddress, 'id'> & { id?: string }) => void;
  /** Delete a saved address. Without it, the address book hides "Delete". */
  onDeleteAddress?: (id: string) => void;
  /** Make an address the default of a kind. Without it, the address book hides "Make default". */
  onSetDefaultAddress?: (id: string, kind: AddressKind) => void;
  /** Remove a product from the wishlist. Without it, the wishlist page hides the remove buttons. */
  onRemoveWishlistItem?: (productId: string) => void;
  /**
   * Download URL for a purchased file: used by the downloads library, the order detail page and the order
   * confirmation. Default "#" placeholders that don't navigate.
   */
  downloadHref?: (productId: string, fileId: string) => string;
}

export const defaultProductHref = (product: Product) => `/products/${product.handle}`;
export const defaultLineHref = (line: CartLine) => `/products/${line.productId}`;
