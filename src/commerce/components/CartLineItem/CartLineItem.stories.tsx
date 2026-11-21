import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { cartView, lineHref, Width } from '../../stories/cartStories';
import layout from '../../stories/storyLayout.module.css';
import { CartLineItem, type CartLineItemProps } from './CartLineItem';

const meta = { title: 'Commerce/Cart/CartLineItem', component: CartLineItem, tags: ['vrt-mobile'] } satisfies Meta<typeof CartLineItem>;
export default meta;
type Story = StoryObj<{ name?: string }>;

const noop = () => undefined;
const view = (key: Parameters<typeof cartView>[0], lineId: string, extra: Partial<CartLineItemProps> = {}): CartLineItemProps => {
  const v = cartView(key);
  const line = v.cart.lines.find((l) => l.id === lineId)!;
  return { line, amounts: v.totals.lines.find((l) => l.lineId === lineId)!, href: lineHref(line), notes: v.notes[lineId], issue: v.issues.find((i) => i.lineId === lineId), onQuantityChange: noop, onRemove: noop, ...extra };
};

const cases: [string, CartLineItemProps][] = [
  ['Physical', view('physicalOnly', 'l2')],
  ['Sale (compare-at price)', view('mixed', 'l1')],
  ['Digital (no stepper)', view('digitalOnly', 'l2')],
  ['Subscription', view('subscriptionOnly', 'l2')],
  ['Subscribe and save', view('mixed', 'l2')],
  ['Subscription with trial', view('subscriptionTrial', 'l1')],
  ['Backorder, ships separately', view('subscriptionTrial', 'l2')],
  ['Out of stock', view('withOutOfStockLine', 'l2', { onSaveForLater: noop })],
  ['Quantity above stock', view('quantityAboveStock', 'l1', { onSaveForLater: noop })],
  ['Updating', view('physicalOnly', 'l1', { status: 'updating' })],
  ['Error', view('physicalOnly', 'l3', { status: 'error' })],
  ['Long title', view('longTitles', 'l1')],
];

/** Every state at full width, then compact lines (MiniCart, OrderSummary) and a narrow container. */
export const Matrix: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <div>
        {cases.map(([label, props]) => (
          <div key={label}>
            <p className={layout.label}>{label}</p>
            <CartLineItem {...props} />
          </div>
        ))}
      </div>
      <Width rem={24}>
        <p className={layout.label}>Compact (read-only, and with a stepper for a physical line)</p>
        <CartLineItem {...view('mixed', 'l2', { onQuantityChange: undefined, onRemove: undefined })} variant="compact" />
        <CartLineItem {...view('mixed', 'l3', { onQuantityChange: undefined, onRemove: undefined })} variant="compact" />
        <CartLineItem {...view('physicalOnly', 'l2')} variant="compact" />
      </Width>
      <Width rem={20}>
        <p className={layout.label}>Full, narrow container (stacked)</p>
        <CartLineItem {...view('longTitles', 'l1')} />
      </Width>
    </div>
  ),
};

function Stateful() {
  const base = view('quantityAboveStock', 'l2');
  const [quantity, setQuantity] = useState(1);
  const [removed, setRemoved] = useState(false);
  if (removed) return <p>Removed</p>;
  return <CartLineItem {...base} line={{ ...base.line, quantity }} onQuantityChange={(_, q) => setQuantity(q)} onRemove={() => setRemoved(true)} />;
}

/** The remove button names its product; the stepper stops at 1 and at the stock limit. */
export const RemoveAndLimits: Story = {
  parameters: { vrt: { screenshot: false } },
  render: () => (
    <>
      <Stateful />
      <CartLineItem {...view('quantityAboveStock', 'l1')} />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Decrease quantity of Waxed canvas tote' })).toBeDisabled();
    // Candle: 5 in the cart, 3 in stock. Increase is disabled and the reason is shown.
    await expect(canvas.getByRole('button', { name: 'Increase quantity of Beeswax pillar candle' })).toBeDisabled();
    await expect(canvas.getByText('Only 3 left. Reduce the quantity to continue.')).toBeVisible();
    await expect(canvas.getAllByRole('spinbutton')[1]).toHaveValue(5); // the real quantity stays visible
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Waxed canvas tote from cart' }));
    await expect(canvas.getByText('Removed')).toBeVisible();
  },
};

