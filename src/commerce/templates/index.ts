import { defineTemplate, type Templates } from '../../templates/types';
import type { CartPage, CheckoutPage, CollectionPage, OrderConfirmationPage, ProductPage } from '../types/pages';
import { canRenderCart, CartTemplate } from './CartTemplate';
import { canRenderCheckout, CheckoutTemplate } from './CheckoutTemplate';
import { canRenderConfirmation, OrderConfirmationTemplate } from './OrderConfirmationTemplate';
import type { PageContent } from '../../content-types/blocks';
import type { AccountAddressesPage, AccountDashboardPage, AccountDownloadsPage, AccountOrderPage, AccountOrdersPage, AccountSubscriptionPage, AccountSubscriptionsPage, AccountWishlistPage, AuthPage } from '../types/account-pages';
import { AuthTemplate, canRenderAuth } from './AuthTemplate';
import {
  AccountAddressesTemplate,
  AccountDashboardTemplate,
  AccountDownloadsTemplate,
  AccountOrdersTemplate,
  AccountOrderTemplate,
  AccountSubscriptionsTemplate,
  AccountSubscriptionTemplate,
  AccountWishlistTemplate,
  canRenderAccountPage,
} from './AccountTemplates';

/** Account pages need a customer (or null) plus their own data. */
const accountPage = (...keys: string[]) => (page: PageContent) => canRenderAccountPage(page) && keys.every((k) => (page as unknown as Record<string, unknown>)[k] !== undefined);
const auth = (name: AuthPage['template'], label: string, description: string) => defineTemplate<AuthPage>({ name, label, description, component: AuthTemplate, canRender: canRenderAuth });
import { canRenderCollection, CollectionTemplate } from './CollectionTemplate';
import { canRenderProductDetail, ProductDetailTemplate } from './ProductDetailTemplate';

/**
 * The commerce templates, keyed by template name. Merge them into the core registry with
 * createTemplates(Object.values(commerceTemplates)); the core registry itself knows nothing about them.
 */
export const commerceTemplates: Templates = {
  collection: defineTemplate<CollectionPage>({ name: 'collection', label: 'Collection', description: 'Filterable product listing.', component: CollectionTemplate, canRender: canRenderCollection }),
  'product-detail': defineTemplate<ProductPage>({ name: 'product-detail', label: 'Product detail', description: 'Product page with variants, purchase options and reviews.', component: ProductDetailTemplate, canRender: canRenderProductDetail }),
  cart: defineTemplate<CartPage>({ name: 'cart', label: 'Cart', description: 'Cart lines, totals, promo code and checkout action.', component: CartTemplate, canRender: canRenderCart }),
  checkout: defineTemplate<CheckoutPage>({ name: 'checkout', label: 'Checkout', description: 'Multi-step checkout that adapts to what is in the cart.', component: CheckoutTemplate, canRender: canRenderCheckout }),
  'order-confirmation': defineTemplate<OrderConfirmationPage>({ name: 'order-confirmation', label: 'Order confirmation', description: 'Thank-you page with next steps, downloads and order details.', component: OrderConfirmationTemplate, canRender: canRenderConfirmation }),
  login: auth('login', 'Sign in', 'Sign-in form on the minimal layout.'),
  register: auth('register', 'Create account', 'Registration form with the password checklist.'),
  'forgot-password': auth('forgot-password', 'Forgot password', 'Request a reset link (non-enumerating).'),
  'reset-password': auth('reset-password', 'Reset password', 'Choose a new password; expired-link state.'),
  account: defineTemplate<AccountDashboardPage>({ name: 'account', label: 'Account overview', description: 'Greeting, needs attention, recent orders, subscriptions.', component: AccountDashboardTemplate, canRender: accountPage('orders', 'subscriptions') }),
  'account-orders': defineTemplate<AccountOrdersPage>({ name: 'account-orders', label: 'Orders', description: 'Order history with filters and pagination.', component: AccountOrdersTemplate, canRender: accountPage('orders', 'years') }),
  'account-order': defineTemplate<AccountOrderPage>({ name: 'account-order', label: 'Order detail', description: 'Status, timeline, items, totals, addresses, downloads.', component: AccountOrderTemplate, canRender: accountPage('order') }),
  'account-downloads': defineTemplate<AccountDownloadsPage>({ name: 'account-downloads', label: 'Downloads', description: 'Downloads library with licence keys.', component: AccountDownloadsTemplate, canRender: accountPage('items') }),
  'account-subscriptions': defineTemplate<AccountSubscriptionsPage>({ name: 'account-subscriptions', label: 'Subscriptions', description: 'All subscriptions.', component: AccountSubscriptionsTemplate, canRender: accountPage('subscriptions') }),
  'account-subscription': defineTemplate<AccountSubscriptionPage>({ name: 'account-subscription', label: 'Subscription', description: 'Manage one subscription; its invoices.', component: AccountSubscriptionTemplate, canRender: accountPage('subscription', 'invoices') }),
  'account-addresses': defineTemplate<AccountAddressesPage>({ name: 'account-addresses', label: 'Addresses', description: 'Address book.', component: AccountAddressesTemplate, canRender: accountPage('addresses') }),
  'account-wishlist': defineTemplate<AccountWishlistPage>({ name: 'account-wishlist', label: 'Wishlist', description: 'Saved products.', component: AccountWishlistTemplate, canRender: accountPage('items', 'products') }),
};

export { CartTemplate, CheckoutTemplate, CollectionTemplate, OrderConfirmationTemplate, ProductDetailTemplate };
export { AddressBlock } from './CheckoutTemplate';
export { nextSteps } from './OrderConfirmationTemplate';
export { AuthTemplate } from './AuthTemplate';
export * from './AccountTemplates';
