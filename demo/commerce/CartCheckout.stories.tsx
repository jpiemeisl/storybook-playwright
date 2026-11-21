/*
 * DEMO ONLY: the purchase flow wired to DemoCommerceProvider (in memory, no timers, no network).
 * Interaction stories: play functions and accessibility checks run in the visual suite, without screenshots.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../../src/components/Button';
import { ToastRegion } from '../../src/components/Toast';
import { CartIcon, CartTemplate, CheckoutTemplate, DemoPaymentFields, getCartIssues, getCartNotes, MiniCart, OrderConfirmationTemplate, type CartPage, type CheckoutPage, type CommerceContext } from '../../src/commerce';
import { chrome, mug, products, shippingMethods, tee, tote } from '../../src/commerce/fixtures';
import { useDemoCart, useDemoCheckout, useDemoToasts } from './DemoCommerceProvider';
import { withDemoCommerce } from './withDemoCommerce';

const handles = new Map(products.map((p) => [p.id, p.handle]));
const lineHref: CommerceContext['lineHref'] = (line) => `/products/${handles.get(line.productId)}`;

function Toasts() {
  const { toasts, dismiss } = useDemoToasts();
  return <ToastRegion toasts={toasts} onDismiss={dismiss} />;
}

function AddButtons() {
  const { addLine } = useDemoCart();
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '1rem' }}>
      <Button size="sm" variant="secondary" onClick={() => addLine(mug, 'mug-default')}>
        Add Stoneware mug
      </Button>
      <Button size="sm" variant="secondary" onClick={() => addLine(tee, 'tee-m-moss')}>
        Add Organic cotton tee
      </Button>
      <Button size="sm" variant="secondary" onClick={() => addLine(tote, 'tote-default')}>
        Add Waxed canvas tote
      </Button>
    </div>
  );
}

/** The cart page, live: quantities, removal and promo codes go through the demo cart. */
function DemoCartPage() {
  const demo = useDemoCart();
  const page: CartPage = { id: 'demo-cart', slug: 'cart', template: 'cart', seo: { title: 'Your cart' }, blocks: [], cart: demo.cart, totals: demo.totals, issues: getCartIssues(demo.cart, products), notes: getCartNotes(demo.cart, products) };
  const ctx: CommerceContext = { currentPath: '/cart', lineHref, onQuantityChange: demo.setQuantity, onRemoveLine: demo.removeLine, onApplyPromo: demo.applyPromo, onRemovePromo: demo.removePromo, onCheckout: () => undefined };
  return (
    <>
      <AddButtons />
      <CartTemplate page={page} chrome={chrome} ctx={ctx} />
      <Toasts />
    </>
  );
}

/** Header-style cart icon that opens the MiniCart. */
function DemoMiniCart() {
  const demo = useDemoCart();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <AddButtons />
      <div style={{ padding: '1rem' }}>
        <CartIcon count={demo.totals.itemCount} onClick={() => setOpen(true)} expanded={open} />
      </div>
      <MiniCart open={open} onClose={() => setOpen(false)} cart={demo.cart} totals={demo.totals} issues={getCartIssues(demo.cart, products)} lineHref={lineHref!} onQuantityChange={demo.setQuantity} onRemove={demo.removeLine} links={{ cart: '/cart', checkout: '/checkout', shop: '/shop' }} />
      <Toasts />
    </div>
  );
}

/** Checkout through to the confirmation, live. */
function DemoCheckoutFlow() {
  const demo = useDemoCart();
  const checkout = useDemoCheckout();
  if (checkout.lastOrder) return <OrderConfirmationTemplate page={{ id: 'demo-order', slug: 'order', template: 'order-confirmation', seo: { title: 'Order confirmed' }, blocks: [], order: checkout.lastOrder }} chrome={chrome} ctx={{ lineHref }} />;
  const page: CheckoutPage = {
    id: 'demo-checkout',
    slug: 'checkout',
    template: 'checkout',
    seo: { title: 'Checkout' },
    blocks: [],
    cart: demo.cart,
    totals: demo.totals,
    step: checkout.step,
    values: checkout.values,
    errors: checkout.errors,
    shippingMethods,
    issues: getCartIssues(demo.cart, products),
    notes: getCartNotes(demo.cart, products),
    status: checkout.status,
    errorMessage: checkout.errorMessage,
  };
  return <CheckoutTemplate page={page} chrome={chrome} ctx={{ lineHref, onCheckoutChange: checkout.setValues, onStepChange: checkout.goTo, onPlaceOrder: checkout.placeOrder, paymentFields: <DemoPaymentFields /> }} />;
}

const meta = {
  title: 'Demo/Cart and checkout',
  decorators: [withDemoCommerce()],
  parameters: { layout: 'fullscreen', vrt: { screenshot: false } },
} satisfies Meta;
export default meta;
type Story = StoryObj;

const body = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

/** Add a product: a polite toast appears (focus stays put), the MiniCart shows the line, the toast dismisses by button. */
export const AddThenOpenMiniCart: Story = {
  parameters: { layout: 'fullscreen', vrt: { screenshot: false }, demoCommerce: { cart: 'empty' } },
  render: () => <DemoMiniCart />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const add = canvas.getByRole('button', { name: 'Add Stoneware mug' });
    await userEvent.click(add);
    const region = canvas.getByRole('region', { name: 'Notifications' });
    await waitFor(() => expect(within(region).getByRole('status')).toHaveTextContent('Added to cart'));
    await expect(add).toHaveFocus();
    await userEvent.click(canvas.getByRole('button', { name: 'Cart, 1 item' }));
    const dialog = await body(canvasElement).findByRole('dialog', { name: 'Your cart (1 item)' });
    await expect(within(dialog).getByRole('link', { name: 'Stoneware mug' })).toBeVisible();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close cart' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss: Added to cart' }));
    await waitFor(() => expect(within(region).getByRole('status')).toBeEmptyDOMElement());
  },
};

const dueToday = (canvasElement: HTMLElement) => canvasElement.querySelector('[data-row="dueToday"] dd')!;

/** Changing a quantity updates the totals. */
export const QuantityUpdatesTotals: Story = {
  parameters: { layout: 'fullscreen', vrt: { screenshot: false }, demoCommerce: { cart: 'oneLine' } },
  render: () => <DemoCartPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(dueToday(canvasElement)).toHaveTextContent('$32.35');
    await userEvent.click(canvas.getByRole('button', { name: 'Increase quantity of Stoneware mug' }));
    await waitFor(() => expect(dueToday(canvasElement)).toHaveTextContent('$58.27'));
  },
};

/** A bad code shows its error; WELCOME10 applies and adds a discount row. */
export const PromoCodes: Story = {
  parameters: { layout: 'fullscreen', vrt: { screenshot: false }, demoCommerce: { cart: 'physicalOnly' } },
  render: () => <DemoCartPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Promo code' });
    await userEvent.type(input, 'nope');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(input).toHaveAccessibleDescription(/is not a valid code/));
    await userEvent.clear(input);
    await userEvent.type(input, 'welcome10');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(canvas.getByText('Discount (WELCOME10)')).toBeVisible());
    await expect(canvas.getByRole('list', { name: 'Applied promo codes' })).toHaveTextContent('WELCOME10');
  },
};

/** $56.00 then exactly $75.00: the progress message switches to "unlocked". */
export const FreeShippingBoundary: Story = {
  parameters: { layout: 'fullscreen', vrt: { screenshot: false }, demoCommerce: { cart: 'oneLine' } },
  render: () => <DemoCartPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add Organic cotton tee' }));
    await waitFor(() => expect(canvas.getByText('You’re $19.00 away from free shipping')).toBeVisible());
    await userEvent.click(canvas.getByRole('button', { name: 'Add Waxed canvas tote' }));
    await waitFor(() => expect(canvas.getByText('You’ve unlocked free shipping')).toBeVisible());
    await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '7500');
  },
};

/** Removing the last line shows the empty cart. */
export const RemoveLastLine: Story = {
  parameters: { layout: 'fullscreen', vrt: { screenshot: false }, demoCommerce: { cart: 'oneLine' } },
  render: () => <DemoCartPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Stoneware mug from cart' }));
    await expect(await canvas.findByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
    await waitFor(() => expect(canvas.getByRole('region', { name: 'Notifications' })).toHaveTextContent('Removed from cart'));
  },
};

/** Digital-only: information goes straight to payment; focus moves to the new step heading. */
export const DigitalSkipsShipping: Story = {
  parameters: { layout: 'fullscreen', vrt: { screenshot: false }, demoCommerce: { cart: 'digitalOnly', checkout: 'digital' } },
  render: () => <DemoCheckoutFlow />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Continue to payment' }));
    const heading = await canvas.findByRole('heading', { level: 1, name: 'Payment' });
    await waitFor(() => expect(heading).toHaveFocus());
    const nav = canvas.getByRole('navigation', { name: 'Checkout steps' });
    await expect(nav.querySelectorAll('ol > li')).toHaveLength(3);
    await waitFor(() => expect(within(nav).getByRole('status')).toHaveTextContent('Step 2 of 3: Payment'));
  },
};

const continueTo = async (canvasElement: HTMLElement, label: string, heading: string) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: label }));
  await waitFor(() => expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(heading));
};

/** Mixed cart: shipping address, digital delivery note and renewal terms on the payment step. */
export const MixedPaymentCopy: Story = {
  parameters: { layout: 'fullscreen', vrt: { screenshot: false }, demoCommerce: { cart: 'mixed', checkout: 'mixed' } },
  render: () => <DemoCheckoutFlow />,
  play: async ({ canvasElement }) => {
    await continueTo(canvasElement, 'Continue to shipping', 'Shipping method');
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Ship to' })).toBeVisible();
    await continueTo(canvasElement, 'Continue to payment', 'Payment');
    await expect(canvas.getByText('Digital delivery')).toBeVisible();
    await expect(canvas.getByRole('checkbox', { name: 'I understand how my subscription renews and how to cancel' })).toHaveAccessibleDescription(/renews automatically \(\$41\.80 every month starting Apr 21, 2026\)/);
  },
};

/** Place order: the confirmation lists the download and the renewal. */
export const PlaceOrder: Story = {
  parameters: { layout: 'fullscreen', vrt: { screenshot: false }, demoCommerce: { cart: 'mixed', checkout: 'mixed' } },
  render: () => <DemoCheckoutFlow />,
  play: async ({ canvasElement }) => {
    await continueTo(canvasElement, 'Continue to shipping', 'Shipping method');
    await continueTo(canvasElement, 'Continue to payment', 'Payment');
    await continueTo(canvasElement, 'Continue to review', 'Review your order');
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Place order' }));
    await expect(await canvas.findByRole('heading', { level: 1, name: 'Thank you for your order' })).toBeVisible();
    await expect(canvas.getByText('FH-2101', { selector: 'strong' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Download small-garden-guide.pdf' })).toBeVisible();
    await expect(canvas.getAllByText(/House coffee beans: \$23\.80 \/ month, next charge Apr 21, 2026/).length).toBeGreaterThan(0);
  },
};

/** demo.failPlaceOrder: the review step shows the failure; nothing is placed. */
export const PlaceOrderFails: Story = {
  parameters: { layout: 'fullscreen', vrt: { screenshot: false }, demoCommerce: { cart: 'physicalOnly', checkout: 'physical' }, demo: { failPlaceOrder: true } },
  render: () => <DemoCheckoutFlow />,
  play: async ({ canvasElement }) => {
    await continueTo(canvasElement, 'Continue to shipping', 'Shipping method');
    await continueTo(canvasElement, 'Continue to payment', 'Payment');
    await continueTo(canvasElement, 'Continue to review', 'Review your order');
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Place order' }));
    await expect(await canvas.findByText('Your order was not placed')).toBeVisible();
    await expect(canvas.queryByRole('heading', { name: 'Thank you for your order' })).toBeNull();
  },
};
