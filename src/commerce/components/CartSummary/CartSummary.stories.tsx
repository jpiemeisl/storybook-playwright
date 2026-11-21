import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { ButtonLink } from '../../../components/Button';
import { carts } from '../../fixtures';
import { computeCartTotals } from '../../logic/cart';
import { cartContext, totalsFor } from '../../stories/cartStories';
import type { Cart } from '../../types/cart';
import { CartSummary } from './CartSummary';

const meta = { title: 'Commerce/Cart/CartSummary', component: CartSummary, tags: ['vrt-mobile'] } satisfies Meta<typeof CartSummary>;
export default meta;
type Story = StoryObj<Record<string, never>>;

/** All totals large: twenty lines bought in bulk. */
const bulk: Cart = { ...carts.twentyLines, lines: carts.twentyLines.lines.map((l) => ({ ...l, quantity: l.quantity * 33 })) };

const cases: [string, ReturnType<typeof totalsFor>, boolean?][] = [
  ['Physical only', totalsFor(carts.physicalOnly)],
  ['Shipping unknown (before an address)', totalsFor(carts.physicalOnly), false],
  ['Free shipping unlocked ($75.00)', totalsFor(carts.freeShippingAt)],
  ['Promo applied (WELCOME10 + SHIPFREE)', totalsFor(carts.withPromo)],
  ['Digital only (no shipping row)', totalsFor(carts.digitalOnly)],
  ['Subscription only', totalsFor(carts.subscriptionOnly)],
  ['Subscription with trial', totalsFor(carts.subscriptionWithTrial)],
  ['Mixed', totalsFor(carts.mixed)],
  ['All totals large', computeCartTotals(bulk, cartContext)],
];

/** One panel per case, with the checkout action slot on the first. */
export const Matrix: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(20rem, 100%), 1fr))', alignItems: 'start' }}>
      {cases.map(([label, totals, known], i) => (
        <div key={label}>
          <CartSummary
            title={label}
            totals={totals}
            shippingKnown={known}
            headingLevel={3}
            action={
              i === 0 ? (
                <ButtonLink href="/checkout" size="lg">
                  Check out
                </ButtonLink>
              ) : undefined
            }
          />
        </div>
      ))}
    </div>
  ),
};

/** A description list; digital-only carts have no Shipping row; "Due today" is its own row. */
export const Structure: Story = {
  parameters: { vrt: { screenshot: false } },
  render: () => (
    <>
      <div data-testid="digital">
        <CartSummary totals={totalsFor(carts.digitalOnly)} title="Digital order summary" />
      </div>
      <div data-testid="physical">
        <CartSummary totals={totalsFor(carts.physicalOnly)} title="Physical order summary" headingLevel={3} />
      </div>
    </>
  ),
  play: async ({ canvasElement }) => {
    const digital = within(within(canvasElement).getByTestId('digital'));
    const physical = within(within(canvasElement).getByTestId('physical'));
    await expect(digital.getAllByRole('term')[0]!.closest('dl')).toBeTruthy();
    await expect(digital.queryByText(/^Shipping/)).toBeNull();
    await expect(physical.getByText(/^Shipping/)).toBeVisible();
    await expect(digital.getByText('Due today').tagName).toBe('DT');
    await expect(digital.getByText('Estimated tax')).toBeVisible();
  },
};
