import type { Meta, StoryObj } from '@storybook/react-vite';
import { accountOrders, accountSubscriptions, DEMO_NOW } from '../../fixtures';
import layout from '../../stories/storyLayout.module.css';
import { OrderStatusBadge, SubscriptionStatusBadge } from './StatusBadge';

const meta = { title: 'Commerce/Account/StatusBadges', component: OrderStatusBadge } satisfies Meta<typeof OrderStatusBadge>;
export default meta;
type Story = StoryObj<Record<string, never>>;

/** Order statuses (including a digital-only order) and subscription statuses: text and icon, never colour alone. */
export const Matrix: Story = { tags: ['theme-smoke'],
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <p className={layout.label}>Orders</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.entries(accountOrders).map(([key, order]) => (
            <OrderStatusBadge key={key} order={order} />
          ))}
        </div>
      </div>
      <div>
        <p className={layout.label}>Subscriptions</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.entries(accountSubscriptions).map(([key, sub]) => (
            <SubscriptionStatusBadge key={key} subscription={sub} now={DEMO_NOW} />
          ))}
        </div>
      </div>
    </div>
  ),
};
