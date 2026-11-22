/*
 * DEMO ONLY. What every shop page shares: the template registry (core plus commerce), link builders
 * and the base render context (current path, header controls, search).
 */
import { createTemplates } from '../../src/templates';
import { commerceTemplates, type CommerceContext } from '../../src/commerce';
import { products } from '../../src/commerce/fixtures';
import { ShopHeaderActions } from './ShopHeaderActions';
import { useShopRouter } from './router';

export const shopTemplates = createTemplates(Object.values(commerceTemplates));

const handles = new Map(products.map((p) => [p.id, p.handle]));
export const lineHref: NonNullable<CommerceContext['lineHref']> = (line) => `/products/${handles.get(line.productId) ?? line.productId}`;

/** The context every route starts from. */
export function useBaseContext(): CommerceContext {
  const { location, navigate } = useShopRouter();
  return {
    currentPath: location.path,
    headerActions: <ShopHeaderActions />,
    onSearch: (query) => navigate(`/search?q=${encodeURIComponent(query)}`),
    lineHref,
  };
}
