import { defineTemplate, type Templates } from '../../templates/types';
import type { CartPage, CheckoutPage, CollectionPage, OrderConfirmationPage, ProductPage } from '../types/pages';
import { canRenderCart, CartTemplate } from './CartTemplate';
import { canRenderCheckout, CheckoutTemplate } from './CheckoutTemplate';
import { canRenderConfirmation, OrderConfirmationTemplate } from './OrderConfirmationTemplate';
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
};

export { CartTemplate, CheckoutTemplate, CollectionTemplate, OrderConfirmationTemplate, ProductDetailTemplate };
export { AddressBlock } from './CheckoutTemplate';
export { nextSteps } from './OrderConfirmationTemplate';
