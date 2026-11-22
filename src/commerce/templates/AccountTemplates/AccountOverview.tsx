import { Alert } from '../../../components/Alert';
import { Link } from '../../../components/Link';
import type { PageContent } from '../../../content-types/blocks';
import { isObj } from '../../../registry/checker';
import type { TemplateProps } from '../../../templates/types';
import { formatMoney } from '../../../utils/formatMoney';
import { OrderStatusBadge } from '../../components/StatusBadge';
import { SubscriptionCard } from '../../components/SubscriptionCard';
import { getAttentionItems, isAccountEmpty } from '../../logic/account';
import { formatCommerceDate } from '../../logic/pricing';
import type { AccountDashboardPage } from '../../types/account-pages';
import type { CommerceContext } from '../../types/context';
import { AccountLayout, AccountPageSection } from './AccountLayout';
import styles from './AccountTemplates.module.css';

/** Account pages need a `customer` (an object, or null for signed out). */
export const canRenderAccountPage = (page: PageContent) => {
  const customer = (page as { customer?: unknown }).customer;
  return customer === null || isObj(customer);
};

const firstName = (name: string) => name.split(' ')[0] ?? name;

/**
 * Account overview: greeting (h1), "Needs attention" (past-due subscriptions, failed invoices,
 * unavailable downloads), the three most recent orders, active subscriptions as compact cards and
 * quick links. A brand-new account gets a welcome with where to start instead.
 */
export function AccountDashboardTemplate({ page, chrome, ctx }: TemplateProps<AccountDashboardPage> & { ctx?: CommerceContext }) {
  const { customer, orders, subscriptions, now } = page;
  const attention = getAttentionItems(page);
  const live = subscriptions.filter((s) => s.status !== 'cancelled');
  const empty = isAccountEmpty({ ...page, wishlist: page.wishlist });

  return (
    <AccountLayout page={page} chrome={chrome} ctx={ctx} title={customer ? `Hello, ${firstName(customer.name)}` : ''} description={customer ? `Signed in as ${customer.email}` : undefined} signedOutTitle="Sign in to see your account">
      {attention.length > 0 && (
        <AccountPageSection id="attention" title="Needs attention">
          <Alert tone="warning" title={`${attention.length} ${attention.length === 1 ? 'thing needs' : 'things need'} your attention`}>
            <ul className={styles.list}>
              {attention.map((item) => (
                <li key={item.id}>
                  <Link href={item.href}>{item.message}</Link>
                </li>
              ))}
            </ul>
          </Alert>
        </AccountPageSection>
      )}
      {empty ? (
        <AccountPageSection id="welcome" title="Welcome to your account">
          <p>Nothing here yet. When you order, download or subscribe, it all shows up on this page.</p>
          <p>
            <Link href={page.links?.shop ?? '/shop'}>Start shopping</Link>
          </p>
        </AccountPageSection>
      ) : (
        <>
          <AccountPageSection id="recent-orders" title="Recent orders" action={orders.length > 3 ? <Link href="/account/orders">All orders</Link> : undefined}>
            {orders.length === 0 ? (
              <p>No orders yet.</p>
            ) : (
              <ul className={styles.recent}>
                {orders.slice(0, 3).map((order) => (
                  <li key={order.id}>
                    <span className={styles.recentNumber}>{order.number}</span>
                    <span>{formatCommerceDate(order.placedAt)}</span>
                    <OrderStatusBadge order={order} />
                    <span className={styles.recentTotal}>{formatMoney(order.totals.total)}</span>
                    <Link href={`/account/orders/${order.number}`} aria-label={`View order ${order.number}`}>
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AccountPageSection>
          {live.length > 0 && (
            <AccountPageSection id="subscriptions" title="Your subscriptions" action={<Link href="/account/subscriptions">Manage subscriptions</Link>}>
              <div className={styles.cards}>
                {live.map((sub) => (
                  <SubscriptionCard key={sub.id} subscription={sub} now={now} variant="compact" href={`/account/subscriptions/${sub.id}`} />
                ))}
              </div>
            </AccountPageSection>
          )}
        </>
      )}
      <AccountPageSection id="quick-links" title="Quick links">
        <ul className={styles.quick}>
          <li>
            <Link href="/account/addresses">Manage addresses</Link>
          </li>
          <li>
            <Link href="/account/wishlist">Your wishlist</Link>
          </li>
          <li>
            <Link href={page.links?.support ?? '/contact'}>Contact support</Link>
          </li>
        </ul>
      </AccountPageSection>
    </AccountLayout>
  );
}
