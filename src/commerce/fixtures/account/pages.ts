/*
 * Page data for the auth and account templates. `now` is DEMO_NOW (2026-03-21T09:00:00Z).
 */
import { filterOrders, orderYears, type OrderFilter } from '../../logic/account';
import { paginate } from '../../logic/browse';
import type { Customer, Invoice, LibraryItem, SavedAddress, WishlistItem } from '../../types/account';
import type { AccountAddressesPage, AccountDashboardPage, AccountDownloadsPage, AccountOrderPage, AccountOrdersPage, AccountPage, AccountSubscriptionPage, AccountSubscriptionsPage, AccountWishlistPage, AuthPage, AuthTemplateName } from '../../types/account-pages';
import type { CustomerSubscription, Order } from '../../types/order';
import { products } from '../products';
import { DEMO_NOW } from '../store';
import { addressBooks, customers, libraries, wishlistProducts, wishlists } from './library';
import { accountOrders, orderHistories } from './orders';
import { accountSubscriptions, invoiceSets, type AccountSubscriptionKey } from './subscriptions';

export function authPage(template: AuthTemplateName, extra: Partial<AuthPage> = {}): AuthPage {
  const titles = { login: 'Sign in', register: 'Create an account', 'forgot-password': 'Reset your password', 'reset-password': 'Choose a new password' };
  return { id: `page-${template}`, slug: `account/${template}`, template, seo: { title: titles[template] }, blocks: [], action: `/account/${template}`, ...extra };
}

interface AccountData {
  orders: Order[];
  subscriptions: CustomerSubscription[];
  invoices: Invoice[];
  downloads: LibraryItem[];
  addresses: SavedAddress[];
  wishlist: WishlistItem[];
}

/** Navigation counts and optional sections, from the customer's data. */
export const navFor = (data: Partial<AccountData>): AccountPage['nav'] => ({
  counts: { orders: data.orders?.length, downloads: data.downloads?.length, subscriptions: data.subscriptions?.filter((s) => s.status !== 'cancelled').length, wishlist: data.wishlist?.length },
  has: { downloads: !!data.downloads?.length, subscriptions: !!data.subscriptions?.length },
});

/** The data sets behind the dashboard stories. */
export const accountData = {
  /** A long-standing customer: everything, including things that need attention. */
  rich: { orders: orderHistories.twelve, subscriptions: [accountSubscriptions.active, accountSubscriptions.withPlans, accountSubscriptions.trialing, accountSubscriptions.pastDue], invoices: invoiceSets.statuses, downloads: libraries.six, addresses: addressBooks.three, wishlist: wishlists.three },
  /** Rich but nothing needs attention. */
  calm: { orders: orderHistories.three, subscriptions: [accountSubscriptions.active, accountSubscriptions.trialing], invoices: invoiceSets.three.filter((i) => i.status !== 'failed'), downloads: libraries.one, addresses: addressBooks.one, wishlist: wishlists.three },
  /** Every subscription status, for the demo flows. */
  everySubscription: { orders: orderHistories.three, subscriptions: Object.values(accountSubscriptions), invoices: [...invoiceSets.twentyFour, ...invoiceSets.statuses], downloads: libraries.six, addresses: addressBooks.three, wishlist: wishlists.three },
  /** Just signed up. */
  fresh: { orders: [], subscriptions: [], invoices: [], downloads: [], addresses: [], wishlist: [] },
} satisfies Record<string, AccountData>;

const base = <T extends AccountPage['template']>(template: T, slug: string, title: string, customer: Customer | null, data: Partial<AccountData>) => ({
  id: `page-${template}-${slug.replace(/\W+/g, '-')}`,
  slug,
  template,
  seo: { title },
  blocks: [],
  customer,
  now: DEMO_NOW,
  nav: navFor(data),
});

export function dashboardPage(key: keyof typeof accountData, customer: Customer | null = customers.robin): AccountDashboardPage {
  const data = accountData[key];
  return { ...base('account', 'account', 'Your account', customer, data), ...data };
}

export function ordersPage(orders: Order[], filter: OrderFilter = {}, page = 1, customer: Customer | null = customers.robin): AccountOrdersPage {
  const p = paginate(filterOrders(orders, filter), page, 10);
  return { ...base('account-orders', 'account/orders', 'Your orders', customer, { ...accountData.rich, orders }), orders: p.items, totalCount: orders.length, filter, years: orderYears(orders), pagination: { currentPage: p.page, totalPages: p.totalPages } };
}

export function orderPage(key: keyof typeof accountOrders, extra: Partial<AccountOrderPage> = {}): AccountOrderPage {
  const order = accountOrders[key];
  return { ...base('account-order', `account/orders/${order.number}`, `Order ${order.number}`, customers.robin, accountData.rich), order, products, invoiceHref: `/account/invoices/${order.id}.pdf`, ...extra };
}

export function downloadsPage(key: keyof typeof libraries, groupBy?: 'product' | 'order'): AccountDownloadsPage {
  return { ...base('account-downloads', 'account/downloads', 'Your downloads', customers.robin, { ...accountData.rich, downloads: libraries[key] }), items: libraries[key], ...(groupBy ? { groupBy } : {}) };
}

export function subscriptionsPage(subs: CustomerSubscription[] = Object.values(accountSubscriptions)): AccountSubscriptionsPage {
  return { ...base('account-subscriptions', 'account/subscriptions', 'Your subscriptions', customers.robin, { ...accountData.rich, subscriptions: subs }), subscriptions: subs };
}

export function subscriptionPage(key: AccountSubscriptionKey, extra: Partial<AccountSubscriptionPage> = {}): AccountSubscriptionPage {
  const subscription = accountSubscriptions[key];
  const invoices = [...invoiceSets.twentyFour, ...invoiceSets.statuses].filter((i) => i.subscriptionId === subscription.id);
  return { ...base('account-subscription', `account/subscriptions/${subscription.id}`, subscription.productTitle, customers.robin, accountData.rich), subscription, invoices, ...extra };
}

export function addressesPage(key: keyof typeof addressBooks, customer: Customer = customers.robin): AccountAddressesPage {
  return { ...base('account-addresses', 'account/addresses', 'Your addresses', customer, { ...accountData.rich, addresses: addressBooks[key] }), addresses: addressBooks[key] };
}

export function wishlistPage(key: keyof typeof wishlists): AccountWishlistPage {
  const items = wishlists[key];
  return { ...base('account-wishlist', 'account/wishlist', 'Your wishlist', customers.robin, { ...accountData.rich, wishlist: items }), items, products: wishlistProducts.filter((p) => items.some((i) => i.productId === p.id)) };
}

/** The same orders page for a signed-out visitor. */
export const signedOutPage = (): AccountOrdersPage => ({ ...ordersPage([], {}, 1, null), nav: undefined });
