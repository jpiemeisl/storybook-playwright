/*
 * DEMO ONLY. A complete, navigable shop assembled only from library pieces, for Storybook. Never
 * exported from src/ or any bundle. Routes are in-memory (router.tsx); data comes from fixtures and the
 * demo providers. The theme comes from the Storybook toolbar decorator, which wraps every story in
 * <Theme>, so switching theme restyles the whole shop.
 */
import { useMemo } from 'react';
import { ToastRegion } from '../../src/components/Toast';
import { PageRenderer } from '../../src/templates';
import type { CheckoutStepId, CheckoutValues } from '../../src/commerce';
import type { CartFixtureKey } from '../../src/commerce/fixtures';
import { DemoAccountProvider, DemoCommerceProvider, useDemoAccount, useDemoToasts } from '../commerce';
import { AccountRoute, AuthRoute, DEMO_EMAIL } from './AccountRoutes';
import { CartRoute, CheckoutRoute, CollectionRoute, ConfirmationRoute, ProductRoute } from './CommerceRoutes';
import { shopChrome, shopPages } from './content';
import { blogIndexPage, blogPostPage, notFoundPage, searchPage } from './journal';
import { ShopLinkProvider } from './ShopLinkProvider';
import { shopTemplates, useBaseContext } from './shopContext';
import { ShopRouter, useShopRouter, type Location } from './router';
import styles from './DemoShop.module.css';

function ContentRoute() {
  const { route, location } = useShopRouter();
  const ctx = useBaseContext();
  const page = (() => {
    switch (route.name) {
      case 'home':
      case 'about':
      case 'pricing':
      case 'contact':
        return shopPages[route.name];
      case 'blog':
        return blogIndexPage;
      case 'blog-post':
        return blogPostPage(route.slug) ?? notFoundPage;
      case 'search':
        return searchPage(location.query.get('q') ?? '');
      default:
        return notFoundPage;
    }
  })();
  return <PageRenderer page={page} chrome={shopChrome} templates={shopTemplates} ctx={ctx} />;
}

function Routes() {
  const { route } = useShopRouter();
  switch (route.name) {
    case 'collection':
      return <CollectionRoute handle={route.handle} />;
    case 'product':
      return <ProductRoute handle={route.handle} />;
    case 'cart':
      return <CartRoute />;
    case 'checkout':
      return <CheckoutRoute />;
    case 'order-confirmation':
      return <ConfirmationRoute />;
    case 'login':
    case 'register':
    case 'forgot-password':
      return <AuthRoute template={route.name} />;
    case 'account':
    case 'account-orders':
    case 'account-order':
    case 'account-downloads':
    case 'account-subscriptions':
    case 'account-subscription':
    case 'account-addresses':
    case 'account-wishlist':
      return <AccountRoute route={route} />;
    default:
      return <ContentRoute />;
  }
}

/** One notifications region for cart and account toasts (two regions would repeat the landmark). */
function ShopToasts() {
  const cart = useDemoToasts();
  const account = useDemoAccount();
  const toasts = useMemo(() => [...cart.toasts, ...account.toasts.map((t) => ({ ...t, id: `account-${t.id}` }))], [cart.toasts, account.toasts]);
  return <ToastRegion toasts={toasts} onDismiss={(id) => (id.startsWith('account-') ? account.dismissToast(id.slice('account-'.length)) : cart.dismiss(id))} />;
}

/** Part of the demo, not the library: says plainly that nothing is real. */
function DemoBanner() {
  const { route } = useShopRouter();
  return (
    <aside className={styles.banner} aria-label="Demo shop">
      <p>
        <strong>Demo shop:</strong> no real orders or payments.
        {route.name === 'login' && (
          <>
            {' '}
            Sign in as <strong>{DEMO_EMAIL}</strong> with any password.
          </>
        )}
      </p>
    </aside>
  );
}

export interface DemoShopAppProps {
  /** Starting route, e.g. "/collections/garden?o.Size=M". Default "/". */
  initialPath?: string;
  /** Cart fixture to start with. Default "empty". */
  initialCart?: CartFixtureKey;
  /** Starting checkout values and step (checkpoint stories). */
  initialCheckout?: CheckoutValues;
  initialStep?: CheckoutStepId;
  /** Start signed in as the demo customer. Default false. */
  signedIn?: boolean;
  /** Called after each in-memory navigation (for tests and the Storybook actions panel). */
  onNavigate?: (location: Location) => void;
}

export function DemoShopApp({ initialPath = '/', initialCart = 'empty', initialCheckout, initialStep, signedIn = false, onNavigate }: DemoShopAppProps) {
  return (
    <ShopRouter initial={initialPath} onNavigate={onNavigate}>
      <DemoCommerceProvider initialCart={initialCart} initialCheckout={initialCheckout} initialStep={initialStep}>
        <DemoAccountProvider data="calm" signedOut={!signedIn}>
          <ShopLinkProvider>
            <DemoBanner />
            <Routes />
            <ShopToasts />
          </ShopLinkProvider>
        </DemoAccountProvider>
      </DemoCommerceProvider>
    </ShopRouter>
  );
}
