/*
 * The account templates other than the overview. Each wraps its components in AccountLayout and wires
 * them to the CommerceContext callbacks; the page data says what to show.
 */
import { useState } from 'react';
import { Heading } from '../../../components/Heading';
import { Link } from '../../../components/Link';
import type { PageContent } from '../../../content-types/blocks';
import type { TemplateProps } from '../../../templates/types';
import { AddressBlock } from '../../components/AddressBlock';
import { AddressBook } from '../../components/AddressBook';
import { DownloadList } from '../../components/DownloadList';
import { DownloadsLibrary } from '../../components/DownloadsLibrary';
import { InvoiceList } from '../../components/InvoiceList';
import { ManageSubscription } from '../../components/ManageSubscription';
import { OrderActions, OrderItemsList, OrderTotalsSummary } from '../../components/OrderDetail';
import { OrderHistory } from '../../components/OrderHistory';
import { OrderTimeline } from '../../components/OrderTimeline';
import { OrderStatusBadge } from '../../components/StatusBadge';
import { SubscriptionCard } from '../../components/SubscriptionCard';
import { WishlistGrid } from '../../components/WishlistGrid';
import { getOrderSections, getOrderStatusInfo } from '../../logic/account';
import { orderDownloadHref } from '../../logic/downloads';
import { formatCommerceDate } from '../../logic/pricing';
import type { AccountAddressesPage, AccountDownloadsPage, AccountOrderPage, AccountOrdersPage, AccountSubscriptionPage, AccountSubscriptionsPage, AccountWishlistPage } from '../../types/account-pages';
import { defaultLineHref, defaultProductHref, type CommerceContext } from '../../types/context';
import { accountBase, AccountLayout, AccountPageSection } from './AccountLayout';
import styles from './AccountTemplates.module.css';

type Props<P extends PageContent> = TemplateProps<P> & { ctx?: CommerceContext };

/** Order history page: the customer's orders with status and year filters and pagination, or an empty state with a shop link. */
export function AccountOrdersTemplate({ page, chrome, ctx }: Props<AccountOrdersPage>) {
  return (
    <AccountLayout page={page} chrome={chrome} ctx={ctx} title="Your orders" description={page.totalCount ? `${page.totalCount} ${page.totalCount === 1 ? 'order' : 'orders'}` : undefined} signedOutTitle="Sign in to view your orders">
      <OrderHistory basePath={`${accountBase(page.links)}/orders`} orders={page.orders} totalCount={page.totalCount} filter={page.filter} years={page.years} pagination={page.pagination} shopHref={page.links?.shop} />
    </AccountLayout>
  );
}

/** Order detail: status and timeline, items, totals, addresses, downloads and actions; sections only when they apply. */
export function AccountOrderTemplate({ page, chrome, ctx }: Props<AccountOrderPage>) {
  const { order } = page;
  const sections = getOrderSections(order);
  const status = getOrderStatusInfo(order);
  const perLine = !!page.products?.length;
  const base = accountBase(page.links);
  return (
    <AccountLayout
      page={page}
      chrome={chrome}
      ctx={ctx}
      title={`Order ${order.number}`}
      description={`Placed ${formatCommerceDate(order.placedAt)}`}
      breadcrumbs={page.breadcrumbs ?? [{ label: 'Account', href: base }, { label: 'Orders', href: `${base}/orders` }, { label: `Order ${order.number}` }]}
      signedOutTitle="Sign in to view this order"
    >
      <AccountPageSection id="order-status" title="Status">
        <div className={styles.statusRow}>
          <OrderStatusBadge order={order} />
          <p>{status.description}</p>
        </div>
        <OrderTimeline order={order} />
      </AccountPageSection>
      <AccountPageSection id="order-items" title="Items">
        <OrderItemsList order={order} lineHref={ctx?.lineHref ?? defaultLineHref} products={page.products} downloadHref={ctx?.downloadHref} />
      </AccountPageSection>
      {sections.downloads && !perLine && (
        <AccountPageSection id="order-downloads" title="Downloads">
          <DownloadList downloads={order.downloads!} hrefFor={orderDownloadHref(order, ctx?.downloadHref, page.products)} />
        </AccountPageSection>
      )}
      <AccountPageSection id="order-total" title="Total">
        <OrderTotalsSummary order={order} />
      </AccountPageSection>
      {(sections.shipping || sections.billingAddress) && (
        <AccountPageSection id="order-addresses" title="Addresses">
          <div className={styles.addresses}>
            {sections.shipping && (
              <div>
                <Heading as="h3" size="md">
                  Shipping address
                </Heading>
                <AddressBlock address={order.shippingAddress!} />
                {order.shippingMethod && <p className={styles.muted}>{order.shippingMethod.label}</p>}
              </div>
            )}
            {sections.billingAddress && (
              <div>
                <Heading as="h3" size="md">
                  Billing address
                </Heading>
                <AddressBlock address={order.billingAddress!} />
              </div>
            )}
          </div>
        </AccountPageSection>
      )}
      <OrderActions order={order} onReorder={ctx?.onReorder ? () => ctx.onReorder!(order) : undefined} invoiceHref={page.invoiceHref} supportHref={page.links?.support} />
    </AccountLayout>
  );
}

/** Downloads library page: every purchased digital file, searchable and grouped by product or order. File links come from `ctx.downloadHref`. */
export function AccountDownloadsTemplate({ page, chrome, ctx }: Props<AccountDownloadsPage>) {
  const [query, setQuery] = useState('');
  const href = ctx?.downloadHref;
  return (
    <AccountLayout page={page} chrome={chrome} ctx={ctx} title="Your downloads" signedOutTitle="Sign in to download your files">
      <DownloadsLibrary items={page.items} groupBy={page.groupBy} query={query} onQueryChange={setQuery} hrefFor={href ? (item, file) => href(item.productId, file.fileId) : undefined} orderHref={(n) => `${accountBase(page.links)}/orders/${n}`} />
    </AccountLayout>
  );
}

/** Subscriptions list page: one SubscriptionCard per subscription linking to its detail page, or a link to browse subscriptions when there are none. */
export function AccountSubscriptionsTemplate({ page, chrome, ctx }: Props<AccountSubscriptionsPage>) {
  return (
    <AccountLayout page={page} chrome={chrome} ctx={ctx} title="Your subscriptions" signedOutTitle="Sign in to manage your subscriptions">
      {page.subscriptions.length === 0 ? (
        <p>
          You have no subscriptions. <Link href={page.links?.shop ?? '/shop?kind=subscription'}>Browse subscriptions</Link>
        </p>
      ) : (
        <div className={styles.cards}>
          {page.subscriptions.map((sub) => (
            <SubscriptionCard key={sub.id} subscription={sub} now={page.now} headingLevel={2} href={`${accountBase(page.links)}/subscriptions/${sub.id}`} onUpdatePayment={ctx?.onSubscriptionAction ? () => ctx.onSubscriptionAction!(sub.id, { type: 'update-payment' }) : undefined} />
          ))}
        </div>
      )}
    </AccountLayout>
  );
}

/** Subscription detail: the card (status, dates, payment summary), the actions (only with `ctx.onSubscriptionAction`) and the invoices. */
export function AccountSubscriptionTemplate({ page, chrome, ctx }: Props<AccountSubscriptionPage>) {
  const sub = page.subscription;
  const act = ctx?.onSubscriptionAction;
  const base = accountBase(page.links);
  return (
    <AccountLayout
      page={page}
      chrome={chrome}
      ctx={ctx}
      title={sub.productTitle}
      description={`${sub.plan} plan`}
      breadcrumbs={[{ label: 'Account', href: base }, { label: 'Subscriptions', href: `${base}/subscriptions` }, { label: sub.productTitle }]}
      signedOutTitle="Sign in to manage this subscription"
    >
      <AccountPageSection id="subscription-plan" title="Plan and billing">
        <SubscriptionCard subscription={sub} now={page.now} paymentFields={ctx?.paymentFields} onUpdatePayment={act ? () => act(sub.id, { type: 'update-payment' }) : undefined} />
      </AccountPageSection>
      {act && (
        <AccountPageSection id="subscription-manage" title="Manage">
          <ManageSubscription subscription={sub} now={page.now} onAction={(r) => act(sub.id, r)} status={page.status} errorMessage={page.errorMessage} accessNote={page.accessNote} />
        </AccountPageSection>
      )}
      <AccountPageSection id="subscription-invoices" title="Invoices">
        <InvoiceList invoices={page.invoices} onRetry={ctx?.onRetryInvoice} />
      </AccountPageSection>
    </AccountLayout>
  );
}

/**
 * Address book page: saved addresses with add, edit, delete and set-default, wired to the `ctx` address
 * callbacks (a control is hidden when its callback is missing). `page.status` and `page.errorMessage`
 * report an async change's outcome.
 */
export function AccountAddressesTemplate({ page, chrome, ctx }: Props<AccountAddressesPage>) {
  return (
    <AccountLayout page={page} chrome={chrome} ctx={ctx} title="Your addresses" signedOutTitle="Sign in to manage your addresses">
      <AddressBook addresses={page.addresses} status={page.status} errorMessage={page.errorMessage} onSave={ctx?.onSaveAddress} onDelete={ctx?.onDeleteAddress} onSetDefault={ctx?.onSetDefaultAddress} />
    </AccountLayout>
  );
}

/** Wishlist page: saved products in a grid with remove and quick add, wired to the `ctx` callbacks (no remove buttons without `ctx.onRemoveWishlistItem`). */
export function AccountWishlistTemplate({ page, chrome, ctx }: Props<AccountWishlistPage>) {
  return (
    <AccountLayout page={page} chrome={chrome} ctx={ctx} title="Your wishlist" signedOutTitle="Sign in to see your wishlist">
      <WishlistGrid items={page.items} products={page.products} hrefFor={ctx?.productHref ?? defaultProductHref} onRemove={ctx?.onRemoveWishlistItem} onQuickAdd={ctx?.onQuickAdd} shopHref={page.links?.shop} />
    </AccountLayout>
  );
}
