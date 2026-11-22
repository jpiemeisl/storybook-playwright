import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Width } from '../../stories/cartStories';
import layout from '../../stories/storyLayout.module.css';
import { SignedOutPrompt } from '../SignedOutPrompt';
import { AccountNav } from './AccountNav';

const meta = { title: 'Commerce/Account/AccountNav', component: AccountNav, tags: ['vrt-mobile'] } satisfies Meta<typeof AccountNav>;
export default meta;
type Story = StoryObj<Record<string, never>>;

const all = { downloads: true, subscriptions: true };

/** Sidebar (narrow container), full-width row with many items and counts, minimal set, and the signed-out prompt. */
export const Matrix: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <Width rem={16}>
        <p className={layout.label}>Sidebar, current: Orders, with counts</p>
        <AccountNav label="Account (sidebar)" currentPath="/account/orders/FH-1001" has={all} counts={{ orders: 12, downloads: 6, subscriptions: 3, wishlist: 14 }} onSignOut={() => undefined} />
      </Width>
      <div>
        <p className={layout.label}>Full width row, current: Wishlist</p>
        <AccountNav label="Account (row)" currentPath="/account/wishlist" has={all} counts={{ orders: 60, wishlist: 3 }} onSignOut={() => undefined} />
      </div>
      <Width rem={16}>
        <p className={layout.label}>New customer (no downloads or subscriptions), current: Overview</p>
        <AccountNav label="Account (new customer)" currentPath="/account" />
      </Width>
      <SignedOutPrompt title="Sign in to view your orders" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sidebar = canvas.getByRole('navigation', { name: 'Account (sidebar)' });
    await expect(within(sidebar).getByRole('link', { name: /^Orders/ })).toHaveAttribute('aria-current', 'page');
    await expect(within(sidebar).getByRole('link', { name: 'Orders , 12' })).toBeVisible();
    await expect(within(sidebar).getByRole('button', { name: 'Sign out' })).toBeVisible();
    const fresh = canvas.getByRole('navigation', { name: 'Account (new customer)' });
    await expect(within(fresh).queryByRole('link', { name: /Downloads/ })).toBeNull();
    await expect(within(fresh).getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
    // Every nav landmark on the page has a unique name.
    const names = canvas.getAllByRole('navigation').map((n) => n.getAttribute('aria-label'));
    await expect(new Set(names).size).toBe(names.length);
  },
};
