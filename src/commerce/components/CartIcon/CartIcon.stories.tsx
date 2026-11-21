import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../../../components/Button';
import { CartIcon } from './CartIcon';

const meta = { title: 'Commerce/Cart/CartIcon', component: CartIcon } satisfies Meta<typeof CartIcon>;
export default meta;
type Story = StoryObj<typeof meta>;

/** 0 (no badge), 1, 7 and 120 (badge "99+", name keeps 120), as links and as a button. */
export const Matrix: Story = {
  args: { count: 0 },
  render: () => (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '0.5rem' }}>
      {[0, 1, 7, 120].map((n) => (
        <CartIcon key={n} count={n} href="/cart" />
      ))}
      <CartIcon count={3} onClick={() => undefined} expanded={false} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: 'Cart, 0 items' })).not.toHaveTextContent(/\d/);
    await expect(canvas.getByRole('link', { name: 'Cart, 1 item' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Cart, 120 items' }).parentElement).toHaveTextContent('99+');
    await expect(canvas.getByRole('button', { name: 'Cart, 3 items' })).toHaveAttribute('aria-haspopup', 'dialog');
  },
};

function Counter() {
  const [count, setCount] = useState(2);
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <CartIcon count={count} href="/cart" />
      <Button size="sm" onClick={() => setCount((c) => c + 1)}>
        Add one
      </Button>
    </div>
  );
}

/** Nothing is announced on first render; a count change is announced politely. */
export const AnnouncesChanges: Story = {
  args: { count: 2 },
  parameters: { vrt: { screenshot: false } },
  render: () => <Counter />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole('status');
    await expect(status).toBeEmptyDOMElement();
    await userEvent.click(canvas.getByRole('button', { name: 'Add one' }));
    await waitFor(() => expect(status).toHaveTextContent('Cart updated, 3 items'));
    await expect(canvas.getByRole('link', { name: 'Cart, 3 items' })).toBeVisible();
  },
};
