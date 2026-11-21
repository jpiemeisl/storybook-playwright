import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { carts } from '../../fixtures';
import { totalsFor } from '../../stories/cartStories';
import layout from '../../stories/storyLayout.module.css';
import type { Cart } from '../../types/cart';
import { FreeShippingProgress } from './FreeShippingProgress';

const meta = { title: 'Commerce/Cart/FreeShippingProgress', component: FreeShippingProgress } satisfies Meta<typeof FreeShippingProgress>;
export default meta;
type Story = StoryObj<Record<string, never>>;

const forCart = (cart: Cart) => {
  const t = totalsFor(cart);
  return { progress: t.freeShippingProgress, subtotal: t.subtotal, hasShippable: t.flags.hasShippable };
};
const sixty: Cart = { ...carts.oneLine, lines: [{ ...carts.oneLine.lines[0]!, quantity: 2 }], id: 'sixty' }; // $48.00 of $75.00 (64%)
const zero: Cart = { ...carts.digitalOnly, id: 'zero', lines: [{ ...carts.freeShippingAt.lines[0]!, quantity: 1, snapshot: { ...carts.freeShippingAt.lines[0]!.snapshot, unitPrice: { amount: 0, currency: 'USD' } } }] };

const cases: [string, Cart][] = [
  ['0%', zero],
  ['About 60%', sixty],
  ['Boundary: $74.99', carts.freeShippingBelow],
  ['Reached: $75.00', carts.freeShippingAt],
];

/** 0%, about 60%, one cent short, reached; a digital-only cart renders nothing. */
export const Matrix: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem', maxInlineSize: '26rem' }}>
      {cases.map(([label, cart]) => (
        <div key={label}>
          <p className={layout.label}>{label}</p>
          <FreeShippingProgress {...forCart(cart)} />
        </div>
      ))}
      <div data-testid="hidden">
        <p className={layout.label}>Hidden (digital only)</p>
        <FreeShippingProgress {...forCart(carts.digitalOnly)} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bars = canvas.getAllByRole('progressbar');
    await expect(bars).toHaveLength(4);
    await expect(canvas.getByText('You’re $0.01 away from free shipping')).toBeVisible();
    await expect(bars[2]).toHaveAccessibleName('You’re $0.01 away from free shipping');
    await expect(bars[2]).toHaveAttribute('aria-valuenow', '7499');
    await expect(bars[2]).toHaveAttribute('aria-valuemax', '7500');
    await expect(bars[3]).toHaveAccessibleName('You’ve unlocked free shipping');
    await expect(within(canvas.getByTestId('hidden')).queryByRole('progressbar')).toBeNull();
  },
};
