import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { accountSubscriptions, DEMO_NOW, invoiceSets } from '../../fixtures';
import layout from '../../stories/storyLayout.module.css';
import { DemoPaymentFields } from '../PaymentMethodSelector';
import { InvoiceList } from '../InvoiceList';
import { SubscriptionCard } from './SubscriptionCard';

const meta = { title: 'Commerce/Account/SubscriptionCard', component: SubscriptionCard, tags: ['vrt-mobile'] } satisfies Meta<typeof SubscriptionCard>;
export default meta;
type Story = StoryObj<Record<string, never>>;

const grid = { display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(20rem, 100%), 1fr))', alignItems: 'start' } as const;

/** Every status (full), then compact cards for the dashboard. */
export const Matrix: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <div style={grid}>
        {Object.entries(accountSubscriptions).map(([key, sub]) => (
          <SubscriptionCard key={key} subscription={sub} now={DEMO_NOW} href={`/account/subscriptions/${sub.id}`} onUpdatePayment={() => undefined} paymentFields={key === 'pastDue' ? <DemoPaymentFields /> : undefined} />
        ))}
      </div>
      <div>
        <p className={layout.label}>Compact</p>
        <div style={grid}>
          {(['active', 'trialing', 'pastDue'] as const).map((key) => (
            <SubscriptionCard key={key} subscription={accountSubscriptions[key]} now={DEMO_NOW} href="#" variant="compact" />
          ))}
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('Trial ends in 6 days').length).toBeGreaterThan(0);
    await expect(canvas.getByText('Cancels on Apr 2, 2026')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Update payment method' })).toBeVisible();
    await expect(canvasElement.querySelectorAll('input:not([type="radio"])')).toHaveLength(0);
  },
};

/** Invoices: 24 across three years (table on wide, list on narrow), every status with Retry, and none. */
export const Invoices: Story = {
  name: 'InvoiceList',
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={{ display: 'grid', gap: '2rem', maxInlineSize: '56rem' }}>
      <section aria-label="Every status">
        <p className={layout.label}>Every status</p>
        <InvoiceList invoices={invoiceSets.statuses} onRetry={() => undefined} />
      </section>
      <section aria-label="Twenty-four">
        <p className={layout.label}>24 invoices across years</p>
        <InvoiceList invoices={invoiceSets.twentyFour} />
      </section>
      <section aria-label="None">
        <InvoiceList invoices={invoiceSets.none} />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('button', { name: /^Retry payment for invoice INV-2026-0013/ }).length).toBeGreaterThan(0);
    await expect(canvas.getAllByRole('heading', { name: '2025' }).length).toBe(1);
  },
};
