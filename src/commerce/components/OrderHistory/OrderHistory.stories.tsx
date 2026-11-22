import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { orderHistories } from '../../fixtures';
import { filterOrders, orderYears, type OrderFilter } from '../../logic/account';
import { paginate } from '../../logic/browse';
import { Width } from '../../stories/cartStories';
import layout from '../../stories/storyLayout.module.css';
import type { Order } from '../../types/order';
import { OrderHistory } from './OrderHistory';

const meta = { title: 'Commerce/Account/OrderHistory', component: OrderHistory, tags: ['vrt-mobile'] } satisfies Meta<typeof OrderHistory>;
export default meta;
type Story = StoryObj<Record<string, never>>;

const history = (orders: Order[], filter: OrderFilter = {}, page = 1) => {
  const matching = filterOrders(orders, filter);
  const p = paginate(matching, page, 10);
  return { orders: p.items, totalCount: orders.length, filter, years: orderYears(orders), pagination: { currentPage: p.page, totalPages: p.totalPages } };
};
const cell = (label: string, children: React.ReactNode) => (
  <section aria-label={label}>
    <p className={layout.label}>{label}</p>
    {children}
  </section>
);

/**
 * 3, 12 and 60 orders (paginated), filtered, empty, loading and a narrow container. Seven histories on
 * one page repeat the filter and pagination nav landmarks, so landmark-unique is off for this matrix
 * only; the orders template stories check it on a real page.
 */
export const Matrix: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] }, a11y: { config: { rules: [{ id: 'landmark-unique', enabled: false }] } } },
  render: () => (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      {cell('3 orders', <OrderHistory {...history(orderHistories.three)} />)}
      {cell('60 orders, page 2', <OrderHistory {...history(orderHistories.sixty, {}, 2)} />)}
      {cell('Filtered: delivered in 2025', <OrderHistory {...history(orderHistories.sixty, { status: 'delivered', year: '2025' })} />)}
      {cell('Filter with no matches', <OrderHistory {...history(orderHistories.twelve, { status: 'cancelled', year: '2024' })} />)}
      {cell('Empty', <OrderHistory {...history(orderHistories.none)} />)}
      {cell('Loading', <OrderHistory {...history(orderHistories.twelve)} loading />)}
      {cell('Narrow container (cards)', <Width rem={22}><OrderHistory {...history(orderHistories.twelve)} /></Width>)}
    </div>
  ),
};

/** The table has a caption and header scopes; View links name the order; the year filter is a GET form. */
export const TableSemantics: Story = {
  parameters: { vrt: { screenshot: false } },
  render: () => <OrderHistory {...history(orderHistories.twelve)} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvasElement.querySelector('table');
    if (table && getComputedStyle(table.parentElement!).display !== 'none') {
      await expect(within(table).getByText(/^Your orders/, { selector: 'caption' })).toBeInTheDocument();
      await expect(table.querySelectorAll('thead th[scope="col"]')).toHaveLength(6);
      await expect(table.querySelectorAll('tbody th[scope="row"]')).toHaveLength(10);
    }
    const first = orderHistories.twelve[0]!;
    await expect(canvas.getAllByRole('link', { name: `View order ${first.number}` })[0]).toHaveAttribute('href', `/account/orders/${first.number}`);
    const form = canvas.getByRole('combobox', { name: 'Year' }).closest('form')!;
    await expect(form).toHaveAttribute('method', 'get');
    await expect(canvas.getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'page');
  },
};
