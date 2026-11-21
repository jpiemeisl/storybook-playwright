import { defineTemplate, type Templates } from '../../templates/types';
import type { CollectionPage, ProductPage } from '../types/pages';
import { canRenderCollection, CollectionTemplate } from './CollectionTemplate';
import { canRenderProductDetail, ProductDetailTemplate } from './ProductDetailTemplate';

/**
 * The commerce templates, keyed by template name. Merge them into the core registry with
 * createTemplates(Object.values(commerceTemplates)); the core registry itself knows nothing about them.
 */
export const commerceTemplates: Templates = {
  collection: defineTemplate<CollectionPage>({ name: 'collection', label: 'Collection', description: 'Filterable product listing.', component: CollectionTemplate, canRender: canRenderCollection }),
  'product-detail': defineTemplate<ProductPage>({ name: 'product-detail', label: 'Product detail', description: 'Product page with variants, purchase options and reviews.', component: ProductDetailTemplate, canRender: canRenderProductDetail }),
};

export { CollectionTemplate, ProductDetailTemplate };
