/*
 * DEMO ONLY. The clickable demo shop. "Home" is the place to start exploring; the checkpoint stories
 * open at a specific route with a fixture cart, for visual tests. Behaviour tests live in
 * DemoShopJourneys.stories.tsx and DemoShopKeyboard.stories.tsx.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { checkoutValues } from '../../src/commerce/fixtures';
import { DemoShopApp } from './DemoShopApp';

const meta = {
  title: 'Demo shop/Checkpoints',
  component: DemoShopApp,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DemoShopApp>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Start here: every link, form and button works, in memory. Switch the theme in the toolbar. */
export const Home: Story = { tags: ['vrt-full', 'theme-smoke'], args: { initialPath: '/' } };

/** A collection with a size and colour filter applied from the query string. */
export const CollectionFiltered: Story = { tags: ['vrt-full'], args: { initialPath: '/collections/garden?o.Size=M&sort=price-asc' } };

/** A product with variants. */
export const ProductWithVariants: Story = { tags: ['vrt-full'], args: { initialPath: '/products/organic-cotton-tee' } };

/** The cart with physical, digital and subscription lines. */
export const CartMixed: Story = { tags: ['vrt-full'], args: { initialPath: '/cart', initialCart: 'mixed' } };

export const CheckoutInformation: Story = { tags: ['vrt-mobile'], args: { initialPath: '/checkout', initialCart: 'mixed', initialCheckout: checkoutValues.mixed, initialStep: 'information' } };
export const CheckoutShipping: Story = { tags: ['vrt-mobile'], args: { initialPath: '/checkout', initialCart: 'mixed', initialCheckout: checkoutValues.mixed, initialStep: 'shipping' } };
export const CheckoutPayment: Story = { tags: ['vrt-mobile'], args: { initialPath: '/checkout', initialCart: 'mixed', initialCheckout: checkoutValues.mixed, initialStep: 'payment' } };
export const CheckoutReview: Story = { tags: ['vrt-mobile'], args: { initialPath: '/checkout', initialCart: 'mixed', initialCheckout: checkoutValues.mixed, initialStep: 'review' } };

/** Placed from the review step: the confirmation, with downloads and renewals. */
export const Confirmation: Story = {
  tags: ['vrt-full'],
  args: { initialPath: '/checkout', initialCart: 'mixed', initialCheckout: checkoutValues.mixed, initialStep: 'review' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Place order' }));
    await expect(await canvas.findByRole('heading', { level: 1, name: 'Thank you for your order' })).toBeVisible();
    // Focus moves to <main> on navigation; blur it so the screenshot has no focus ring.
    (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
    await waitFor(() => expect(canvas.getByRole('region', { name: 'Notifications' })).toBeInTheDocument());
  },
};

/** Signed in: the account overview. */
export const Dashboard: Story = { tags: ['vrt-full'], args: { initialPath: '/account', signedIn: true } };

/** Phone checkout with the cookie banner: it stacks on top of the sticky checkout bar, never over it. */
export const WithCookieBanner: Story = {
  parameters: { layout: 'fullscreen', vrt: { viewports: [{ width: 375, height: 760 }] } },
  args: { initialPath: '/checkout', initialCart: 'mixed', initialCheckout: checkoutValues.mixed, initialStep: 'information', cookieBanner: true },
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    await waitFor(() => expect(doc.querySelector('[data-sticky-buy-bar]')).not.toBeNull());
    const bar = doc.querySelector('[data-sticky-buy-bar]')!.getBoundingClientRect();
    const banner = within(canvasElement).getByRole('region', { name: 'Cookies on this site' }).getBoundingClientRect();
    await expect(banner.bottom).toBeLessThanOrEqual(bar.top + 1);
  },
};
