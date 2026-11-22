/*
 * DEMO ONLY. An in-memory router for the demo shop: the current path and query live in React state.
 * No dependency, no window.location, no history API, no storage.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export interface Location {
  path: string;
  query: URLSearchParams;
  /** path plus "?query" when there is one. */
  href: string;
}

export type Route =
  | { name: 'home' | 'about' | 'pricing' | 'contact' | 'blog' | 'search' | 'cart' | 'checkout' | 'order-confirmation' }
  | { name: 'login' | 'register' | 'forgot-password' }
  | { name: 'account' | 'account-orders' | 'account-downloads' | 'account-subscriptions' | 'account-addresses' | 'account-wishlist' }
  | { name: 'blog-post'; slug: string }
  | { name: 'collection'; handle: string }
  | { name: 'product'; handle: string }
  | { name: 'account-order'; id: string }
  | { name: 'account-subscription'; id: string }
  | { name: 'not-found' };

const statics: Record<string, Route['name']> = {
  '/': 'home',
  '/about': 'about',
  '/pricing': 'pricing',
  '/contact': 'contact',
  '/blog': 'blog',
  '/search': 'search',
  '/cart': 'cart',
  '/checkout': 'checkout',
  '/order-confirmation': 'order-confirmation',
  '/login': 'login',
  '/register': 'register',
  '/forgot-password': 'forgot-password',
  '/account': 'account',
  '/account/orders': 'account-orders',
  '/account/downloads': 'account-downloads',
  '/account/subscriptions': 'account-subscriptions',
  '/account/addresses': 'account-addresses',
  '/account/wishlist': 'account-wishlist',
};

const dynamic: [RegExp, (value: string) => Route][] = [
  [/^\/blog\/([^/]+)$/, (slug) => ({ name: 'blog-post', slug })],
  [/^\/collections\/([^/]+)$/, (handle) => ({ name: 'collection', handle })],
  [/^\/products\/([^/]+)$/, (handle) => ({ name: 'product', handle })],
  [/^\/account\/orders\/([^/]+)$/, (id) => ({ name: 'account-order', id })],
  [/^\/account\/subscriptions\/([^/]+)$/, (id) => ({ name: 'account-subscription', id })],
];

/** The route for a path (no query). Unknown paths are "not-found". */
export function matchRoute(path: string): Route {
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path;
  const name = statics[clean];
  if (name) return { name } as Route;
  for (const [pattern, build] of dynamic) {
    const match = pattern.exec(clean);
    if (match) return build(decodeURIComponent(match[1]!));
  }
  return { name: 'not-found' };
}

/** Splits "/search?q=mug" into a Location. Hash fragments are dropped. */
export function parseHref(href: string): Location {
  const [beforeHash] = href.split('#');
  const [path = '/', search = ''] = beforeHash!.split('?');
  const query = new URLSearchParams(search);
  const qs = query.toString();
  return { path: path || '/', query, href: qs ? `${path}?${qs}` : path || '/' };
}

/** Internal hrefs start with one "/" (not "//"). Everything else is left to the browser. */
export const isInternalHref = (href: string | undefined): href is string => !!href && href.startsWith('/') && !href.startsWith('//');

interface RouterValue {
  location: Location;
  route: Route;
  navigate: (href: string) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

export function ShopRouter({ initial = '/', onNavigate, children }: { initial?: string; onNavigate?: (location: Location) => void; children: ReactNode }) {
  const [location, setLocation] = useState(() => parseHref(initial));
  const navigate = useCallback(
    (href: string) => {
      const next = parseHref(href);
      setLocation(next);
      onNavigate?.(next);
    },
    [onNavigate],
  );
  const value = useMemo(() => ({ location, route: matchRoute(location.path), navigate }), [location, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useShopRouter(): RouterValue {
  const value = useContext(RouterContext);
  if (!value) throw new Error('useShopRouter must be used inside <ShopRouter>.');
  return value;
}
