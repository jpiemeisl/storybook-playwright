/*
 * Page shapes for the auth and account templates. JSON-serializable; the host supplies `now` (ISO 8601)
 * so status text such as "Trial ends in 6 days" never reads the clock. Callbacks live in CommerceContext.
 */
import type { PageContent } from '../../content-types/blocks';
import type { BreadcrumbItem } from '../../content-types/navigation';
import type { OrderFilter } from '../logic/account';
import type { Customer, Invoice, LibraryItem, SavedAddress, WishlistItem } from './account';
import type { CustomerSubscription, Order } from './order';
import type { Product } from './product';

/** Links the auth and account templates use. Defaults under "/account". */
export interface AccountLinks {
  login?: string;
  register?: string;
  forgotPassword?: string;
  shop?: string;
  terms?: string;
  privacy?: string;
  support?: string;
}

/** Template names for the auth pages; selects which form an AuthPage renders. */
export type AuthTemplateName = 'login' | 'register' | 'forgot-password' | 'reset-password';

/** Sign in, create account, forgot password and reset password. */
export interface AuthPage extends PageContent {
  template: AuthTemplateName;
  /** Site layout variant. Default `minimal`. */
  layout?: 'minimal' | 'default';
  /** Form action for the no-JavaScript POST. */
  action?: string;
  status?: 'idle' | 'submitting' | 'error' | 'success';
  errorMessage?: string;
  /** Forgot password: the email the request was made for (success message). */
  email?: string;
  /** Reset password: the link has expired. */
  expired?: boolean;
  links?: AccountLinks;
}

/** Fields every account page has. `customer: null` renders the signed-out prompt. */
interface AccountPageBase extends PageContent {
  customer: Customer | null;
  /** ISO 8601 "now", for status text. */
  now: string;
  /** Navigation counts and which optional sections exist. */
  nav?: { counts?: Partial<Record<'orders' | 'downloads' | 'subscriptions' | 'addresses' | 'wishlist', number>>; has?: { downloads?: boolean; subscriptions?: boolean } };
  links?: AccountLinks;
}

/** The account overview. */
export interface AccountDashboardPage extends AccountPageBase {
  template: 'account';
  /** Most recent first; the dashboard shows three. */
  orders: Order[];
  subscriptions: CustomerSubscription[];
  invoices: Invoice[];
  downloads: LibraryItem[];
  addresses: SavedAddress[];
  wishlist: WishlistItem[];
}

/** Page data for the order history page (template `account-orders`): one filtered, paginated page of orders. */
export interface AccountOrdersPage extends AccountPageBase {
  template: 'account-orders';
  /** This page of orders (already filtered and paginated). */
  orders: Order[];
  /** All orders before filtering (0 shows "No orders yet"). */
  totalCount: number;
  filter?: OrderFilter;
  years: string[];
  pagination?: { currentPage: number; totalPages: number };
}

/** Page data for a single order's detail page (template `account-order`). */
export interface AccountOrderPage extends AccountPageBase {
  template: 'account-order';
  order: Order;
  /** Invoice PDF for "Download invoice". */
  invoiceHref?: string;
  /** Catalogue products, to show each digital line's files with it. */
  products?: Product[];
  breadcrumbs?: BreadcrumbItem[];
}

/** Page data for the downloads library page (template `account-downloads`). */
export interface AccountDownloadsPage extends AccountPageBase {
  template: 'account-downloads';
  items: LibraryItem[];
  groupBy?: 'product' | 'order';
}

/** Page data for the subscriptions list page (template `account-subscriptions`). */
export interface AccountSubscriptionsPage extends AccountPageBase {
  template: 'account-subscriptions';
  subscriptions: CustomerSubscription[];
}

/** Page data for managing one subscription (template `account-subscription`), with its invoices and the last action's state. */
export interface AccountSubscriptionPage extends AccountPageBase {
  template: 'account-subscription';
  subscription: CustomerSubscription;
  /** Invoices for this subscription. */
  invoices: Invoice[];
  /** The last action's state. */
  status?: 'idle' | 'submitting' | 'error';
  errorMessage?: string;
  /** What happens to digital access when cancelled (from your data). */
  accessNote?: string;
}

/** Page data for the address book page (template `account-addresses`). */
export interface AccountAddressesPage extends AccountPageBase {
  template: 'account-addresses';
  addresses: SavedAddress[];
  errorMessage?: string;
}

/** Page data for the wishlist page (template `account-wishlist`). */
export interface AccountWishlistPage extends AccountPageBase {
  template: 'account-wishlist';
  items: WishlistItem[];
  /** Products the items refer to. */
  products: Product[];
}

/** Any account page's data, discriminated by `template`; the shape a host passes to the account templates. */
export type AccountPage = AccountDashboardPage | AccountOrdersPage | AccountOrderPage | AccountDownloadsPage | AccountSubscriptionsPage | AccountSubscriptionPage | AccountAddressesPage | AccountWishlistPage;
