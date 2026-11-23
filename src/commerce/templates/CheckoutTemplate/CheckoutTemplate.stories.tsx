import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { checkoutPage, checkoutValues, chrome, type CartFixtureKey } from '../../fixtures';
import { DemoPaymentFields } from '../../components/PaymentMethodSelector';
import { expectHeadingOutline } from '../../stories/browseStories';
import { lineHref } from '../../stories/cartStories';
import type { CheckoutStepId } from '../../types/checkout';
import type { CheckoutPage } from '../../types/pages';
import { CheckoutTemplate } from './CheckoutTemplate';

type Args = { cart: CartFixtureKey; step: CheckoutStepId; values: keyof typeof checkoutValues; extra?: Partial<CheckoutPage> };

const noop = () => undefined;
const ctx = { currentPath: '/checkout', lineHref, onCheckoutChange: noop, onStepChange: noop, onPlaceOrder: noop, paymentFields: <DemoPaymentFields /> };

const meta = {
  title: 'Commerce/Templates/Checkout',
  parameters: { layout: 'fullscreen' },
  args: { cart: 'mixed', step: 'information', values: 'mixed' },
  render: ({ cart, step, values, extra }: Args) => <CheckoutTemplate page={checkoutPage(cart, step, checkoutValues[values], extra)} chrome={chrome} ctx={ctx} />,
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;

// Tags are written on each story: Storybook reads them statically, so spreading them in is ignored.
const mobile = { layout: 'fullscreen', vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } };
const outline: Story['play'] = async ({ canvasElement }) => expectHeadingOutline(canvasElement);

// Mixed cart: every step (information, payment and review are the main screenshots).
export const MixedInformation: Story = { tags: ['vrt-full'], parameters: { layout: 'fullscreen' }, play: outline };
export const MixedShipping: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { step: 'shipping' } };
export const MixedPayment: Story = { tags: ['vrt-full', 'theme-smoke'], parameters: { layout: 'fullscreen' }, args: { step: 'payment' }, play: outline };
export const MixedReview: Story = { tags: ['vrt-full'], parameters: { layout: 'fullscreen' }, args: { step: 'review' }, play: outline };

// Physical only.
export const PhysicalInformation: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { cart: 'physicalOnly', values: 'physical' } };
export const PhysicalShipping: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { cart: 'physicalOnly', step: 'shipping', values: 'physical' } };
export const PhysicalPayment: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { cart: 'physicalOnly', step: 'payment', values: 'physical' } };
export const PhysicalReview: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { cart: 'physicalOnly', step: 'review', values: 'physical' } };
/** Free shipping reached: every method shows "Free". */
export const FreeShippingMethods: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { cart: 'freeShippingAt', step: 'shipping', values: 'physical' } };

// Digital only: no shipping step, billing address on the information step.
export const DigitalInformation: Story = {
  tags: ['vrt-mobile'],
  parameters: mobile,
  args: { cart: 'digitalOnly', values: 'digital' },
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation', { name: 'Checkout steps' });
    await expect(nav.querySelectorAll('ol > li')).toHaveLength(3); // the list is hidden on narrow screens
    await expect(nav).toHaveTextContent('Step 1 of 3: Information');
    await expect(within(canvasElement).getByRole('group', { name: 'Billing address' })).toBeVisible();
    await expect(within(canvasElement).getByRole('button', { name: 'Continue to payment' })).toBeVisible();
  },
};
const noBillingStepChange = fn();
/** ctx.collectBillingAddress false: no billing address fields, and continuing needs only the email. */
export const WithoutBillingAddress: Story = {
  parameters: { layout: 'fullscreen', vrt: { screenshot: false } },
  args: { cart: 'digitalOnly', values: 'invalidDigitalBilling' },
  render: ({ cart, step, values, extra }: Args) => <CheckoutTemplate page={checkoutPage(cart, step, checkoutValues[values], extra)} chrome={chrome} ctx={{ ...ctx, collectBillingAddress: false, onStepChange: noBillingStepChange }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    noBillingStepChange.mockClear();
    await expect(canvas.queryByRole('group', { name: 'Billing address' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Continue to payment' }));
    await expect(canvas.queryByRole('alert')).toBeNull();
    await waitFor(() => expect(noBillingStepChange).toHaveBeenCalledWith('payment'));
  },
};
export const DigitalPayment: Story = { tags: ['vrt-full'], parameters: { layout: 'fullscreen' }, args: { cart: 'digitalOnly', step: 'payment', values: 'digital' }, play: outline };
export const DigitalReview: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { cart: 'digitalOnly', step: 'review', values: 'digital' } };

// Subscription only, with a trial.
export const SubscriptionInformation: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { cart: 'subscriptionWithTrial', values: 'subscription' } };
export const SubscriptionPayment: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { cart: 'subscriptionWithTrial', step: 'payment', values: 'subscription' } };
export const SubscriptionReview: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { cart: 'subscriptionWithTrial', step: 'review', values: 'subscription' } };

/** A failed continue: the error summary takes focus and its links move focus to each field. */
export const ErrorSummary: Story = {
  tags: ['vrt-mobile'],
  parameters: mobile,
  args: { values: 'invalidInformation' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Continue to shipping' }));
    const summary = await canvas.findByRole('alert');
    await waitFor(() => expect(summary).toHaveFocus());
    await expect(within(summary).getAllByRole('link')).toHaveLength(4);
    await userEvent.click(within(summary).getByRole('link', { name: 'Enter a city' }));
    await expect(canvasElement.ownerDocument.getElementById('shipping-city')).toHaveFocus();
    await userEvent.click(within(summary).getByRole('link', { name: /email address in the correct format/ }));
    await expect(canvasElement.ownerDocument.getElementById('checkout-email')).toHaveFocus();
    summary.focus();
  },
};
export const Submitting: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { step: 'review', extra: { status: 'submitting' } } };
export const PlaceOrderError: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { step: 'review', extra: { status: 'error', errorMessage: 'Your payment was declined. You have not been charged. Try another payment method.' } } };
export const EmptyCartGuard: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { cart: 'empty', values: 'empty' }, play: outline };
export const BlockedByIssues: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { cart: 'withOutOfStockLine', values: 'physical' }, play: outline };
