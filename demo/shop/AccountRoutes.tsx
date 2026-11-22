/*
 * DEMO ONLY. Sign-in and account routes. "Sign in" accepts the fixed demo customer's email with any
 * non-empty password: there is no real authentication. Account data lives in DemoAccountProvider.
 */
import { useState } from 'react';
import { PageRenderer } from '../../src/templates';
import { filterOrders, orderYears, paginate, type AccountPage, type AuthPage, type CommerceContext } from '../../src/commerce';
import { authPage, customers, navFor, products, wishlistProducts } from '../../src/commerce/fixtures';
import { useDemoAccount, type DemoAccount } from '../commerce';
import { notFoundPage } from './journal';
import { shopChrome } from './content';
import { shopTemplates, useBaseContext } from './shopContext';
import { useShopRouter, type Route } from './router';

/** The demo customer's email, shown on the demo banner of the sign-in page. */
export const DEMO_EMAIL = customers.robin.email;

const links = { login: '/login', register: '/register', forgotPassword: '/forgot-password', shop: '/collections/all' };

function useAccountContext(): CommerceContext {
  const base = useBaseContext();
  const { navigate } = useShopRouter();
  const account = useDemoAccount();
  return {
    ...base,
    onSignOut: () => {
      account.perform({ type: 'signOut' });
      navigate('/');
    },
    onSubscriptionAction: (id, request) => account.perform({ type: 'subscription', id, request }),
    onSaveAddress: (address) => account.perform({ type: 'saveAddress', address }),
    onDeleteAddress: (id) => account.perform({ type: 'deleteAddress', id }),
    onSetDefaultAddress: (id, kind) => account.perform({ type: 'setDefaultAddress', id, kind }),
    onRemoveWishlistItem: (productId) => account.perform({ type: 'removeWishlistItem', productId }),
  };
}

const shell = <T extends AccountPage['template']>(template: T, slug: string, title: string, account: DemoAccount) => ({
  id: `shop-${template}`,
  slug,
  template,
  seo: { title },
  blocks: [],
  customer: account.customer,
  now: account.now,
  nav: navFor(account),
  links,
});

type AccountRouteName = Extract<Route, { name: `account${string}` }>;

/** The account page for a route, from the live demo account. Undefined for unknown ids. */
function accountPage(route: AccountRouteName, account: DemoAccount, query: URLSearchParams) {
  switch (route.name) {
    case 'account':
      return { ...shell('account', 'account', 'Your account', account), orders: account.orders, subscriptions: account.subscriptions, invoices: account.invoices, downloads: account.downloads, addresses: account.addresses, wishlist: account.wishlist };
    case 'account-orders': {
      const p = paginate(filterOrders(account.orders, {}), Number(query.get('page')) || 1, 10);
      return { ...shell('account-orders', 'account/orders', 'Your orders', account), orders: p.items, totalCount: account.orders.length, filter: {}, years: orderYears(account.orders), pagination: { currentPage: p.page, totalPages: p.totalPages } };
    }
    case 'account-order': {
      const order = account.orders.find((o) => o.id === route.id || o.number === route.id);
      return order && { ...shell('account-order', `account/orders/${order.number}`, `Order ${order.number}`, account), order, products };
    }
    case 'account-downloads':
      return { ...shell('account-downloads', 'account/downloads', 'Your downloads', account), items: account.downloads };
    case 'account-subscriptions':
      return { ...shell('account-subscriptions', 'account/subscriptions', 'Your subscriptions', account), subscriptions: account.subscriptions };
    case 'account-subscription': {
      const subscription = account.subscriptions.find((s) => s.id === route.id);
      const error = account.lastError?.scope === route.id ? account.lastError.message : undefined;
      return subscription && { ...shell('account-subscription', `account/subscriptions/${subscription.id}`, subscription.productTitle, account), subscription, invoices: account.invoices.filter((i) => i.subscriptionId === subscription.id), status: error ? 'error' : 'idle', errorMessage: error };
    }
    case 'account-addresses':
      return { ...shell('account-addresses', 'account/addresses', 'Your addresses', account), addresses: account.addresses };
    case 'account-wishlist':
      return { ...shell('account-wishlist', 'account/wishlist', 'Your wishlist', account), items: account.wishlist, products: wishlistProducts.filter((p) => account.wishlist.some((w) => w.productId === p.id)) };
  }
}

export function AccountRoute({ route }: { route: AccountRouteName }) {
  const ctx = useAccountContext();
  const account = useDemoAccount();
  const { location } = useShopRouter();
  const page = accountPage(route, account, location.query) ?? notFoundPage;
  return <PageRenderer page={page as AccountPage} chrome={shopChrome} templates={shopTemplates} ctx={ctx} />;
}

export function AuthRoute({ template }: { template: 'login' | 'register' | 'forgot-password' }) {
  const base = useBaseContext();
  const { navigate } = useShopRouter();
  const account = useDemoAccount();
  const [state, setState] = useState<Pick<AuthPage, 'status' | 'errorMessage' | 'email'>>({ status: 'idle' });
  const signIn = () => {
    account.perform({ type: 'signIn' });
    navigate('/account');
  };
  const ctx: CommerceContext = {
    ...base,
    onLogin: ({ email, password }) => {
      if (email.trim().toLowerCase() === DEMO_EMAIL && password !== '') signIn();
      else setState({ status: 'error' });
    },
    onRegister: () => signIn(),
    onForgotPassword: ({ email }) => setState({ status: 'success', email }),
  };
  return <PageRenderer page={authPage(template, { ...state, links, layout: 'default' })} chrome={shopChrome} templates={shopTemplates} ctx={ctx} />;
}
