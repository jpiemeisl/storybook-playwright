import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { accountOrders, products } from '../../fixtures';
import { lineHref } from '../../stories/cartStories';
import layout from '../../stories/storyLayout.module.css';
import { OrderActions, OrderItemsList, OrderTotalsSummary } from '../OrderDetail';
import { OrderTimeline } from './OrderTimeline';

const meta = { title: 'Commerce/Account/OrderTimeline', component: OrderTimeline, tags: ['vrt-mobile'] } satisfies Meta<typeof OrderTimeline>;
export default meta;
type Story = StoryObj<Record<string, never>>;

const unsafeTracking = { ...accountOrders.shipped, tracking: { ...accountOrders.shipped.tracking!, url: 'javascript:alert(1)' } };
const safeTracking = { ...accountOrders.delivered, tracking: { ...accountOrders.delivered.tracking!, url: 'https://track.parcelway.example/PW2047700021' } };

/** Every status and kind; tracking with a safe link and with an unsafe one (shown as text). */
export const Matrix: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(18rem, 100%), 1fr))', alignItems: 'start' }}>
      {Object.entries({ ...accountOrders, shipped: unsafeTracking, delivered: safeTracking }).map(([key, order]) => (
        <section key={key} aria-label={`Timeline: ${key}`}>
          <p className={layout.label}>{key}</p>
          <OrderTimeline order={order} />
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const shipped = within(canvas.getByRole('region', { name: 'Timeline: shipped' }));
    await expect(shipped.getByText('Shipped').closest('li')).toHaveAttribute('aria-current', 'step');
    await expect(shipped.getByText('Shipped').closest('li')).toHaveTextContent('(In progress)');
    await expect(shipped.queryByRole('link', { name: 'PW2048813377' })).toBeNull(); // unsafe href: text only
    const delivered = within(canvas.getByRole('region', { name: 'Timeline: delivered' }));
    await expect(delivered.getByRole('link', { name: /PW2047700021/ })).toHaveAttribute('href', 'https://track.parcelway.example/PW2047700021');
    await expect(delivered.queryByText('(In progress)')).toBeNull();
  },
};

/** Order detail sections for the mixed order: items with per-line downloads, totals with "Billed today", actions. */
export const DetailPieces: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={{ display: 'grid', gap: '2rem', maxInlineSize: '44rem' }}>
      <OrderItemsList order={accountOrders.mixed} lineHref={lineHref} products={products} />
      <OrderTotalsSummary order={accountOrders.mixed} />
      <OrderTotalsSummary order={accountOrders.subscriptionTrial} />
      <OrderActions order={accountOrders.mixed} onReorder={() => undefined} invoiceHref="/account/invoices/i11.pdf" />
    </div>
  ),
};
