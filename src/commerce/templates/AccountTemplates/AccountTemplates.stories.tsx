import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { expect, within } from 'storybook/test';
import { addressesPage, chrome, dashboardPage, downloadsPage, orderHistories, orderPage, ordersPage, signedOutPage, subscriptionPage, subscriptionsPage, wishlistPage } from '../../fixtures';
import { DemoPaymentFields } from '../../components/PaymentMethodSelector';
import { expectHeadingOutline } from '../../stories/browseStories';
import { lineHref } from '../../stories/cartStories';
import type { CommerceContext } from '../../types/context';
import { AccountDashboardTemplate } from './AccountOverview';
import { AccountAddressesTemplate, AccountDownloadsTemplate, AccountOrdersTemplate, AccountOrderTemplate, AccountSubscriptionsTemplate, AccountSubscriptionTemplate, AccountWishlistTemplate } from './AccountPages';

const ctx = (currentPath: string): CommerceContext => ({ currentPath, lineHref, onSignOut: () => undefined, onSubscriptionAction: () => undefined, onRetryInvoice: () => undefined, onReorder: () => undefined, paymentFields: <DemoPaymentFields /> });

const meta = { title: 'Commerce/Templates/Account', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj;

const mobile = { layout: 'fullscreen', vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } };
const outline: Story['play'] = async ({ canvasElement }) => expectHeadingOutline(canvasElement);
const r = (el: ReactElement) => () => el;

// Main screenshots (vrt-full).
export const DashboardRich: Story = { tags: ['vrt-full'], parameters: { layout: 'fullscreen' }, render: r(<AccountDashboardTemplate page={dashboardPage('calm')} chrome={chrome} ctx={ctx('/account')} />), play: outline };
export const Orders: Story = {
  tags: ['vrt-full'],
  parameters: { layout: 'fullscreen' },
  render: r(<AccountOrdersTemplate page={ordersPage(orderHistories.twelve)} chrome={chrome} ctx={ctx('/account/orders')} />),
  play: async ({ canvasElement }) => {
    await expectHeadingOutline(canvasElement);
    await expect(within(canvasElement).getByRole('navigation', { name: 'Account' })).toBeVisible();
    await expect(within(canvasElement).getByRole('link', { name: /^Orders/ })).toHaveAttribute('aria-current', 'page');
  },
};
export const OrderDetailMixed: Story = { tags: ['vrt-full'], parameters: { layout: 'fullscreen' }, render: r(<AccountOrderTemplate page={orderPage('mixed')} chrome={chrome} ctx={ctx('/account/orders/FH-2004')} />), play: outline };
export const Downloads: Story = { tags: ['vrt-full'], parameters: { layout: 'fullscreen' }, render: r(<AccountDownloadsTemplate page={downloadsPage('six')} chrome={chrome} ctx={ctx('/account/downloads')} />), play: outline };
export const Subscriptions: Story = { tags: ['vrt-full'], parameters: { layout: 'fullscreen' }, render: r(<AccountSubscriptionsTemplate page={subscriptionsPage()} chrome={chrome} ctx={ctx('/account/subscriptions')} />), play: outline };
export const SubscriptionActive: Story = { tags: ['vrt-full'], parameters: { layout: 'fullscreen' }, render: r(<AccountSubscriptionTemplate page={subscriptionPage('withPlans')} chrome={chrome} ctx={ctx('/account/subscriptions/sub-a2')} />), play: outline };
export const Addresses: Story = { tags: ['vrt-full'], parameters: { layout: 'fullscreen' }, render: r(<AccountAddressesTemplate page={addressesPage('three')} chrome={chrome} ctx={ctx('/account/addresses')} />), play: outline };

// Variants (vrt-mobile).
export const DashboardNeedsAttention: Story = { tags: ['vrt-mobile'], parameters: mobile, render: r(<AccountDashboardTemplate page={dashboardPage('rich')} chrome={chrome} ctx={ctx('/account')} />), play: outline };
export const DashboardNewCustomer: Story = { tags: ['vrt-mobile'], parameters: mobile, render: r(<AccountDashboardTemplate page={dashboardPage('fresh')} chrome={chrome} ctx={ctx('/account')} />), play: outline };
export const OrdersEmpty: Story = { tags: ['vrt-mobile'], parameters: mobile, render: r(<AccountOrdersTemplate page={ordersPage(orderHistories.none)} chrome={chrome} ctx={ctx('/account/orders')} />) };
export const OrderDetailDigital: Story = { tags: ['vrt-mobile'], parameters: mobile, render: r(<AccountOrderTemplate page={orderPage('digital')} chrome={chrome} ctx={ctx('/account/orders/FH-2002')} />), play: outline };
export const OrderDetailSubscription: Story = { tags: ['vrt-mobile'], parameters: mobile, render: r(<AccountOrderTemplate page={orderPage('subscriptionTrial')} chrome={chrome} ctx={ctx('/account/orders/FH-2003')} />) };
export const OrderDetailShipped: Story = { tags: ['vrt-mobile'], parameters: mobile, render: r(<AccountOrderTemplate page={orderPage('shipped')} chrome={chrome} ctx={ctx('/account/orders/FH-1001')} />) };
export const OrderDetailCancelled: Story = { tags: ['vrt-mobile'], parameters: mobile, render: r(<AccountOrderTemplate page={orderPage('cancelled')} chrome={chrome} ctx={ctx('/account/orders/FH-0990')} />) };
export const SubscriptionTrial: Story = { tags: ['vrt-mobile'], parameters: mobile, render: r(<AccountSubscriptionTemplate page={subscriptionPage('trialing')} chrome={chrome} ctx={ctx('/account/subscriptions/sub-a3')} />) };
export const SubscriptionPastDue: Story = { tags: ['vrt-mobile'], parameters: mobile, render: r(<AccountSubscriptionTemplate page={subscriptionPage('pastDue')} chrome={chrome} ctx={ctx('/account/subscriptions/sub-a4')} />) };
export const SubscriptionPaused: Story = { tags: ['vrt-mobile'], parameters: mobile, render: r(<AccountSubscriptionTemplate page={subscriptionPage('paused')} chrome={chrome} ctx={ctx('/account/subscriptions/sub-a5')} />) };
export const SubscriptionCancelling: Story = { tags: ['vrt-mobile'], parameters: mobile, render: r(<AccountSubscriptionTemplate page={subscriptionPage('cancelling')} chrome={chrome} ctx={ctx('/account/subscriptions/sub-a7')} />) };
export const SubscriptionCancelled: Story = { tags: ['vrt-mobile'], parameters: mobile, render: r(<AccountSubscriptionTemplate page={subscriptionPage('cancelled')} chrome={chrome} ctx={ctx('/account/subscriptions/sub-a8')} />) };
export const Wishlist: Story = { tags: ['vrt-mobile'], parameters: mobile, render: r(<AccountWishlistTemplate page={wishlistPage('fourteen')} chrome={chrome} ctx={ctx('/account/wishlist')} />), play: outline };
export const SignedOut: Story = {
  tags: ['vrt-mobile'],
  parameters: mobile,
  render: r(<AccountOrdersTemplate page={signedOutPage()} chrome={chrome} ctx={ctx('/account/orders')} />),
  play: async ({ canvasElement }) => {
    await expectHeadingOutline(canvasElement);
    await expect(within(canvasElement).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/account/login');
    await expect(within(canvasElement).queryByRole('navigation', { name: 'Account' })).toBeNull();
  },
};
