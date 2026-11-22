/*
 * DEMO ONLY. Shop routes: collection (filters, sort and page in the query), product, cart, checkout
 * (step in demo state) and the order confirmation. Data comes from fixtures and the demo providers.
 */
import { useEffect, useRef } from 'react';
import { PageRenderer } from '../../src/templates';
import { buildCollectionListing, DemoPaymentFields, getCartIssues, getCartNotes, parseFilters, parsePage, parseSort, serializeFilters, type CartPage, type CheckoutPage, type CollectionPage, type CommerceContext, type OrderConfirmationPage } from '../../src/commerce';
import { catalog, productPage, products, shippingMethods } from '../../src/commerce/fixtures';
import { useDemoAccount, useDemoCart, useDemoCheckout } from '../commerce';
import { notFoundPage } from './journal';
import { shopChrome } from './content';
import { shopTemplates, useBaseContext } from './shopContext';
import { useShopRouter } from './router';

const render = (page: Parameters<typeof PageRenderer>[0]['page'], ctx: CommerceContext) => <PageRenderer page={page} chrome={shopChrome} templates={shopTemplates} ctx={ctx} />;

/** Products for a collection handle; "all" is the whole catalogue. */
function collectionSource(handle: string) {
  if (handle === 'all') return { title: 'All products', description: 'Everything in the shop.', products: catalog.products };
  const collection = catalog.collections.find((c) => c.handle === handle);
  if (!collection) return undefined;
  return { title: collection.title, description: collection.description, products: catalog.products.filter((p) => collection.productIds.includes(p.id)) };
}

export function CollectionRoute({ handle }: { handle: string }) {
  const { location, navigate } = useShopRouter();
  const base = useBaseContext();
  const cart = useDemoCart();
  const source = collectionSource(handle);
  if (!source) return render(notFoundPage, base);
  const basePath = `/collections/${handle}`;
  const listing = buildCollectionListing(source.products, { filters: parseFilters(location.query), sort: parseSort(location.query), page: parsePage(location.query), perPage: 12, basePath });
  const page: CollectionPage = {
    id: `collection-${handle}`,
    slug: basePath.slice(1),
    template: 'collection',
    seo: { title: source.title },
    blocks: [],
    collection: { title: source.title, description: source.description, breadcrumbs: [{ label: 'Home', href: '/' }, { label: source.title }], productCount: source.products.length },
    listing,
  };
  return render(page, {
    ...base,
    onListingChange: ({ filters, sort, page: n }) => {
      const query = serializeFilters(filters, { sort, page: n });
      navigate(query ? `${basePath}?${query}` : basePath);
    },
    onQuickAdd: (product, variant) => cart.addLine(product, variant.id),
  });
}

export function ProductRoute({ handle }: { handle: string }) {
  const base = useBaseContext();
  const cart = useDemoCart();
  const product = catalog.products.find((p) => p.handle === handle);
  if (!product) return render(notFoundPage, base);
  const page = productPage(product, undefined, { breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'All products', href: '/collections/all' }, { label: product.title }] });
  // key: a new product starts with fresh selection state.
  return (
    <PageRenderer
      key={product.id}
      page={page}
      chrome={shopChrome}
      templates={shopTemplates}
      ctx={{ ...base, onAddToCart: ({ product: p, variantId, quantity, purchaseOption }) => cart.addLine(p, variantId, quantity, purchaseOption) } as CommerceContext}
    />
  );
}

export function CartRoute() {
  const base = useBaseContext();
  const { navigate } = useShopRouter();
  const cart = useDemoCart();
  const page: CartPage = { id: 'cart', slug: 'cart', template: 'cart', seo: { title: 'Your cart' }, blocks: [], cart: cart.cart, totals: cart.totals, issues: getCartIssues(cart.cart, products), notes: getCartNotes(cart.cart, products), links: { shop: '/collections/all', checkout: '/checkout' } };
  return render(page, { ...base, onQuantityChange: cart.setQuantity, onRemoveLine: cart.removeLine, onApplyPromo: cart.applyPromo, onRemovePromo: cart.removePromo, onCheckout: () => navigate('/checkout') });
}

export function CheckoutRoute() {
  const base = useBaseContext();
  const { navigate } = useShopRouter();
  const cart = useDemoCart();
  const checkout = useDemoCheckout();
  const account = useDemoAccount();
  const recorded = useRef(checkout.lastOrder);

  // A newly placed order: record it in the account, empty the cart, show the confirmation.
  useEffect(() => {
    const order = checkout.lastOrder;
    if (!order || order === recorded.current) return;
    recorded.current = order;
    account.perform({ type: 'recordOrder', order });
    cart.clear();
    navigate('/order-confirmation');
  }, [checkout.lastOrder, account, cart, navigate]);

  const page: CheckoutPage = {
    id: 'checkout',
    slug: 'checkout',
    template: 'checkout',
    seo: { title: 'Checkout' },
    blocks: [],
    cart: cart.cart,
    totals: cart.totals,
    step: checkout.step,
    values: checkout.values,
    errors: checkout.errors,
    shippingMethods,
    issues: getCartIssues(cart.cart, products),
    notes: getCartNotes(cart.cart, products),
    status: checkout.status,
    errorMessage: checkout.errorMessage,
    links: { cart: '/cart' },
  };
  return render(page, { ...base, onCheckoutChange: checkout.setValues, onStepChange: checkout.goTo, onPlaceOrder: checkout.placeOrder, paymentFields: <DemoPaymentFields /> });
}

export function ConfirmationRoute() {
  const base = useBaseContext();
  const { lastOrder } = useDemoCheckout();
  if (!lastOrder) return render(notFoundPage, base);
  const page: OrderConfirmationPage = { id: 'order', slug: 'order-confirmation', template: 'order-confirmation', seo: { title: 'Order confirmed' }, blocks: [], order: lastOrder, links: { shop: '/collections/all', order: `/account/orders/${lastOrder.id}` } };
  return render(page, base);
}
