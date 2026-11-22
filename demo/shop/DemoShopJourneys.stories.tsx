/*
 * DEMO ONLY. Journeys through the demo shop as play-function tests. They click through using roles and
 * accessible names only (no test ids) and assert what the customer sees. Behaviour tests: no screenshots.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { DemoShopApp } from './DemoShopApp';
import { acceptTerms, canvasOf, clickButton, continueTo, expectH1, fill, fillInformation, follow, page, signIn } from './journeyHelpers';

const meta = {
  title: 'Demo shop/Journeys',
  component: DemoShopApp,
  // Behaviour tests: the visual suite runs them (play + axe) but never captures them.
  parameters: { layout: 'fullscreen', vrt: { screenshot: false } },
} satisfies Meta<typeof DemoShopApp>;
export default meta;
type Story = StoryObj<typeof meta>;

const notifications = (el: HTMLElement) => canvasOf(el).getByRole('region', { name: 'Notifications' });
const dueToday = (el: HTMLElement) => el.querySelector('[data-row="dueToday"] dd');

/** Home, collection, filter, product, variant, add to cart, mini cart, cart, checkout, place order, confirmation. */
export const PhysicalPurchase: Story = {
  args: { initialPath: '/' },
  play: async ({ canvasElement: el }) => {
    const canvas = canvasOf(el);
    await follow(el, 'Garden', 'Garden');
    await userEvent.click(canvas.getByRole('checkbox', { name: /^M \(\d+\)$/ }));
    await waitFor(() => expect(canvas.queryByRole('link', { name: 'Waxed canvas tote' })).toBeNull());
    await follow(el, 'Organic cotton tee', 'Organic cotton tee');
    await userEvent.click(canvas.getByRole('radio', { name: 'L' }));
    await userEvent.click(canvas.getByRole('radio', { name: 'Moss' }));
    await clickButton(el, 'Add to cart');
    await waitFor(() => expect(notifications(el)).toHaveTextContent('Added to cart'));

    await clickButton(el, 'Cart, 1 item');
    const drawer = within(await page(el).findByRole('dialog', { name: 'Your cart (1 item)' }));
    await expect(drawer.getByRole('link', { name: 'Organic cotton tee' })).toBeVisible();
    await userEvent.click(drawer.getByRole('link', { name: 'View cart' }));
    await expectH1(el, 'Your cart');

    await clickButton(el, 'Check out');
    await expectH1(el, 'Your information');
    await fillInformation(el);
    await continueTo(el, 'Continue to shipping', 'Shipping method');
    await userEvent.click(canvas.getByRole('radio', { name: /^Standard/ }));
    await continueTo(el, 'Continue to payment', 'Payment');
    await acceptTerms(el);
    await continueTo(el, 'Continue to review', 'Review your order');
    await clickButton(el, 'Place order');
    await expectH1(el, 'Thank you for your order');
    await expect(canvas.getByText('FH-2101', { selector: 'strong' })).toBeVisible();
    await expect(canvas.getAllByText(/Organic cotton tee/).length).toBeGreaterThan(0);
    await expect(canvas.queryByRole('link', { name: /^Download/ })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Cart, 0 items' })).toBeVisible();
  },
};

/** Digital: no shipping step, downloads on the confirmation and in the account. */
export const DigitalPurchase: Story = {
  args: { initialPath: '/products/small-garden-guide' },
  play: async ({ canvasElement: el }) => {
    const canvas = canvasOf(el);
    await expectH1(el, /The small garden guide/);
    await clickButton(el, 'Buy and download');
    await follow(el, 'View cart', 'Your cart');
    await clickButton(el, 'Check out');
    await expectH1(el, 'Your information');
    const steps = canvas.getByRole('navigation', { name: 'Checkout steps' });
    await expect(steps.querySelectorAll('ol > li')).toHaveLength(3);
    await expect(within(steps).queryByText('Shipping')).toBeNull();
    await fillInformation(el);
    await continueTo(el, 'Continue to payment', 'Payment');
    await acceptTerms(el);
    await continueTo(el, 'Continue to review', 'Review your order');
    await clickButton(el, 'Place order');
    await expectH1(el, 'Thank you for your order');
    await expect(canvas.getByRole('link', { name: 'Download small-garden-guide.pdf' })).toBeVisible();

    await signIn(el);
    await follow(el, /^Downloads/, 'Your downloads');
    await expect(canvas.getAllByRole('heading', { name: 'The small garden guide (PDF)' })[0]).toBeVisible();
  },
};

/** Trial subscription: nothing due today, renewal text, then manage it in the account (pause, resume, cancel). */
export const SubscriptionWithTrial: Story = {
  args: { initialPath: '/products/garden-planner-app' },
  play: async ({ canvasElement: el }) => {
    const canvas = canvasOf(el);
    await expectH1(el, 'Garden planner app');
    await clickButton(el, 'Start free trial');
    await follow(el, 'View cart', 'Your cart');
    await expect(dueToday(el)).toHaveTextContent('$0.00');
    await expect(canvas.getAllByText(/Apr 4, 2026/).length).toBeGreaterThan(0);
    await clickButton(el, 'Check out');
    await fillInformation(el);
    await continueTo(el, 'Continue to payment', 'Payment');
    await acceptTerms(el);
    await userEvent.click(canvas.getByRole('checkbox', { name: 'I understand how my subscription renews and how to cancel' }));
    await continueTo(el, 'Continue to review', 'Review your order');
    await clickButton(el, 'Place order');
    await expectH1(el, 'Thank you for your order');
    await expect(canvas.getAllByText(/Garden planner app: Free until Apr 4, 2026/).length).toBeGreaterThan(0);

    await signIn(el);
    await follow(el, /^Subscriptions/, 'Your subscriptions');
    await follow(el, /^Manage Garden planner app/, 'Garden planner app');

    await clickButton(el, 'Pause');
    let dialog = within(await page(el).findByRole('dialog'));
    await userEvent.click(dialog.getByRole('radio', { name: '1 month' }));
    await userEvent.click(dialog.getByRole('button', { name: 'Pause subscription' }));
    await waitFor(() => expect(canvas.getAllByText(/Paused until Apr 21, 2026/).length).toBeGreaterThan(0));

    await clickButton(el, 'Resume');
    dialog = within(await page(el).findByRole('dialog'));
    await userEvent.click(dialog.getByRole('button', { name: /^Resume/ }));
    await waitFor(() => expect(canvas.queryAllByText(/Paused until/)).toHaveLength(0));

    await clickButton(el, 'Cancel subscription');
    dialog = within(await page(el).findByRole('dialog'));
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel subscription' }));
    await waitFor(() => expect(canvas.getAllByText(/^Cancels on/).length).toBeGreaterThan(0));
    await expect(notifications(el)).toHaveTextContent(/Garden planner app cancels on/);
  },
};

/** A promo code applies on the cart page and adds a discount row. */
export const PromoCode: Story = {
  args: { initialPath: '/cart', initialCart: 'physicalOnly' },
  play: async ({ canvasElement: el }) => {
    const canvas = canvasOf(el);
    await fill(el, /^Promo code/, 'welcome10');
    await clickButton(el, 'Apply');
    await waitFor(() => expect(canvas.getByText('Discount (WELCOME10)')).toBeVisible());
  },
};

/** A sold-out line blocks checkout with a reason; checkout shows the guard. */
export const CartIssueBlocksCheckout: Story = {
  args: { initialPath: '/cart', initialCart: 'withOutOfStockLine' },
  play: async ({ canvasElement: el }) => {
    const canvas = canvasOf(el);
    await expect(canvas.getByText('Some items need your attention before you check out')).toBeVisible();
    const checkout = canvas.getByRole('button', { name: 'Check out' });
    await expect(checkout).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(checkout);
    await expectH1(el, 'Your cart');
  },
};

/** Search with results, then a query with none. */
export const Search: Story = {
  args: { initialPath: '/' },
  play: async ({ canvasElement: el }) => {
    const canvas = canvasOf(el);
    await follow(el, 'Search', /Search/);
    await fill(el, /^Search/, 'mug');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByRole('link', { name: 'Stoneware mug' })).toBeVisible());
    await fill(el, /^Search/, 'spaceship');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByText(/No results/i)).toBeVisible());
  },
};

/** Login failure (not the demo customer), then success. */
export const Login: Story = {
  args: { initialPath: '/login' },
  play: async ({ canvasElement: el }) => {
    const canvas = canvasOf(el);
    await fill(el, /^Email(?! me)/, 'someone@example.com');
    await userEvent.type(canvas.getByLabelText(/^Password/, { selector: 'input' }), 'not-the-password');
    await clickButton(el, 'Sign in');
    await waitFor(() => expect(canvas.getByText(/The email or password is incorrect/)).toBeVisible());
    await fill(el, /^Email(?! me)/, 'robin@example.com');
    await clickButton(el, 'Sign in');
    await expectH1(el, /Your account|Hello/);
    await expect(canvas.getByRole('link', { name: 'Account: Robin Vale' })).toBeVisible();
  },
};
