import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Stack } from '../../../components/Stack';
import { AddToCart, type AddToCartStatus } from './AddToCart';
import layout from '../../stories/storyLayout.module.css';

const meta = { title: 'Commerce/AddToCart', args: { onAdd: fn() } } satisfies Meta<{ onAdd: () => void }>;
export default meta;
type Story = StoryObj<{ onAdd: () => void }>;

/** Every status, and the idle label for every kind. */
export const Matrix: Story = {
  render: ({ onAdd }) => (
    <div className={layout.narrow} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))' }}>
      {(['idle', 'loading', 'success', 'error'] as AddToCartStatus[]).map((status) => (
        <AddToCart key={status} kind="physical" status={status} onAdd={onAdd} productTitle="Stoneware mug" />
      ))}
      <AddToCart kind="physical" status="disabled" disabledReason="This item is sold out. Choose another option or check back later." onAdd={onAdd} productTitle="Brass desk lamp" />
      <AddToCart kind="physical" status="disabled" disabledLabel="Choose an option" disabledReason="Choose size and colour to continue." onAdd={onAdd} productTitle="Organic cotton tee" />
      <AddToCart kind="digital" status="idle" onAdd={onAdd} productTitle="The small garden guide" />
      <AddToCart kind="subscription" status="idle" onAdd={onAdd} productTitle="Seasonal seed box" />
      <AddToCart kind="subscription" status="idle" trial onAdd={onAdd} productTitle="Garden planner app" />
      <AddToCart kind="physical" status="idle" preorder onAdd={onAdd} productTitle="Enamel stovetop kettle" />
      <AddToCart kind="physical" status="idle" subscription onAdd={onAdd} productTitle="House coffee beans" />
    </div>
  ),
};

function Flow({ onAdd, fail }: { onAdd: () => void; fail?: boolean }) {
  const [status, setStatus] = useState<AddToCartStatus>('idle');
  return (
    <Stack gap="sm">
      <AddToCart
        kind="physical"
        status={status}
        productTitle="Stoneware mug"
        onAdd={() => {
          onAdd();
          setStatus('loading');
        }}
      />
      <button type="button" onClick={() => setStatus(fail ? 'error' : 'success')}>
        Finish request
      </button>
    </Stack>
  );
}

/** Idle → loading → success, announced politely. (The request is simulated with a button: no timers.) */
export const Success: Story = {
  render: ({ onAdd }) => <Flow onAdd={onAdd} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add to cart' }));
    await expect(args.onAdd).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole('button', { name: 'Finish request' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Added Stoneware mug to your cart.');
    await expect(canvas.getByRole('button', { name: 'Added to cart' })).toBeVisible();
  },
};

export const ErrorState: Story = {
  name: 'Error',
  render: ({ onAdd }) => <Flow onAdd={onAdd} fail />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add to cart' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Finish request' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Couldn’t add Stoneware mug to your cart.');
  },
};

/** Disabled stays focusable and its reason is the button's description. */
export const DisabledReason: Story = {
  render: ({ onAdd }) => <AddToCart kind="physical" status="disabled" disabledReason="This item is sold out. Choose another option or check back later." onAdd={onAdd} productTitle="Brass desk lamp" />,
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Sold out' });
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).toHaveAccessibleDescription('This item is sold out. Choose another option or check back later.');
    await userEvent.click(button);
    await expect(args.onAdd).not.toHaveBeenCalled();
  },
};
