import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { Field } from '../../../components/Field';
import { Link } from '../../../components/Link';
import { Pagination } from '../../../components/Pagination';
import { Select } from '../../../components/Select';
import { CategoryFilter } from '../../../components/TagList';
import { formatMoney } from '../../../utils/formatMoney';
import { orderItemsSummary, orderStatusLabel, type OrderFilter } from '../../logic/account';
import { formatCommerceDate } from '../../logic/pricing';
import type { Order, OrderStatus } from '../../types/order';
import { OrderStatusBadge } from '../StatusBadge';
import styles from './OrderHistory.module.css';

/** Props for OrderHistory, the account order list with status and year filters and pagination. */
export interface OrderHistoryProps {
  /** The orders on this page (already filtered and paginated). */
  orders: Order[];
  /** Total orders before filtering; 0 shows the "No orders yet" state. */
  totalCount: number;
  /** The active status and year filter; preselects the filter controls. */
  filter?: OrderFilter;
  /** Years that have orders, for the year filter. */
  years: string[];
  pagination?: { currentPage: number; totalPages: number };
  /** Orders list URL, e.g. "/account/orders". Filters and pages are query strings on it. */
  basePath?: string;
  /** Order detail URL. Default "<basePath>/<number>". */
  hrefFor?: (order: Order) => string;
  loading?: boolean;
  /** "Start shopping" link for the empty state. */
  shopHref?: string;
  /** Heading level of each order card (narrow layout). Default 2. */
  headingLevel?: 2 | 3;
}

const STATUSES: OrderStatus[] = ['processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const query = (filter: OrderFilter, page?: number) => {
  const params = new URLSearchParams();
  if (filter.status) params.set('status', filter.status);
  if (filter.year) params.set('year', filter.year);
  if (page && page > 1) params.set('page', String(page));
  const q = params.toString();
  return q ? `?${q}` : '';
};

/**
 * Order history: status filter (CategoryFilter links), year filter (a GET form, so it works without
 * JavaScript), then cards on narrow containers or a table on wide ones (number, date, status, items,
 * total and a "View order <number>" link), pagination, empty and loading states. Container queries
 * switch between cards and table; the hidden one is display:none, so it is not announced twice.
 */
export function OrderHistory({ orders, totalCount, filter = {}, years, pagination, basePath = '/account/orders', hrefFor = (o) => `${basePath}/${o.number}`, loading = false, shopHref = '/shop', headingLevel = 2 }: OrderHistoryProps) {
  const H = `h${headingLevel}` as const;
  if (!loading && totalCount === 0) return <EmptyState title="No orders yet" message="When you place an order, it shows up here." action={{ label: 'Start shopping', href: shopHref }} headingLevel={headingLevel} />;

  const statusItems = [{ id: 'all', label: 'All', href: basePath + query({ year: filter.year }) }, ...STATUSES.map((s) => ({ id: s, label: orderStatusLabel(s), href: basePath + query({ ...filter, status: s }) }))];
  const view = (order: Order) => (
    <Link href={hrefFor(order)} aria-label={`View order ${order.number}`}>
      View
    </Link>
  );

  return (
    <div className={styles.root} aria-busy={loading || undefined}>
      <div className={styles.filters}>
        <CategoryFilter items={statusItems} selectedIds={[filter.status ?? 'all']} label="Filter orders by status" />
        <form method="get" action={basePath} className={styles.yearForm}>
          {filter.status && <input type="hidden" name="status" value={filter.status} />}
          <Field label="Year" id="order-year">
            <Select name="year" size="sm" defaultValue={filter.year ?? ''} options={[{ value: '', label: 'All years' }, ...years.map((y) => ({ value: y, label: y }))]} />
          </Field>
          <Button type="submit" variant="secondary" size="sm">
            Show
          </Button>
        </form>
      </div>

      {loading ? (
        <div className={styles.skeleton}>
          <p role="status">Loading your orders…</p>
          {[0, 1, 2].map((i) => (
            <span key={i} aria-hidden="true" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState title="No orders match" message="Try another status or year." action={{ label: 'Show all orders', href: basePath }} headingLevel={headingLevel} />
      ) : (
        <>
          <ul className={styles.cards} aria-label="Orders">
            {orders.map((order) => (
              <li key={order.id} className={styles.card}>
                <div className={styles.cardHead}>
                  <H className={styles.number}>Order {order.number}</H>
                  <OrderStatusBadge order={order} />
                </div>
                <p className={styles.meta}>
                  {formatCommerceDate(order.placedAt)} · {formatMoney(order.totals.total)}
                </p>
                <p className={styles.items}>{orderItemsSummary(order)}</p>
                {view(order)}
              </li>
            ))}
          </ul>
          <div className={styles.table}>
            <table>
              <caption className={styles.visuallyHidden}>Your orders{pagination && pagination.totalPages > 1 ? `, page ${pagination.currentPage} of ${pagination.totalPages}` : ''}</caption>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                  <th scope="col">Items</th>
                  <th scope="col" className={styles.numeric}>
                    Total
                  </th>
                  <th scope="col">
                    <span className={styles.visuallyHidden}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <th scope="row">{order.number}</th>
                    <td>{formatCommerceDate(order.placedAt)}</td>
                    <td>
                      <OrderStatusBadge order={order} />
                    </td>
                    <td className={styles.itemsCell}>{orderItemsSummary(order)}</td>
                    <td className={styles.numeric}>{formatMoney(order.totals.total)}</td>
                    <td>{view(order)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} hrefBuilder={(page) => basePath + query(filter, page)} />}
        </>
      )}
    </div>
  );
}
