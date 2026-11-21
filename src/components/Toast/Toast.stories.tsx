import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../Button';
import { Toast, ToastRegion, type ToastData } from './Toast';
import { useToasts } from './useToasts';

const meta = {
  title: 'Feedback/Toast',
  component: ToastRegion,
} satisfies Meta<typeof ToastRegion>;

export default meta;
type Story = StoryObj<{ count?: number }>;

const noop = () => undefined;
const samples: ToastData[] = [
  { id: 'info', tone: 'info', title: 'Prices updated', message: 'Your cart reflects today’s prices.' },
  { id: 'success', tone: 'success', title: 'Added to cart', message: 'Stoneware mug, quantity 1.', action: { label: 'View cart', href: '#cart' } },
  { id: 'warning', tone: 'warning', title: 'Only 2 left', message: 'We reduced the quantity of Brass desk lamp to what is in stock.' },
  { id: 'danger', tone: 'danger', title: 'Could not update your cart', action: { label: 'Try again', onClick: noop } },
  {
    id: 'long',
    tone: 'info',
    title: 'A notification with a very long title that needs to wrap across several lines on narrow screens',
    message:
      'Long messages wrap inside the toast instead of overflowing. Supercalifragilisticexpialidocious-style unbroken words break too, so nothing spills past the edge of the screen.',
  },
];

/** Every tone, with link and button actions and a long message. Toasts on their own (no region). */
export const Matrix: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '0.75rem', maxInlineSize: '24rem' }}>
      {samples.map((t) => (
        <Toast key={t.id} {...t} onDismiss={noop} />
      ))}
    </div>
  ),
};

const stack = (count: number): ToastData[] =>
  Array.from({ length: count }, (_, i) => ({ id: `t${i + 1}`, tone: i % 2 ? 'info' : 'success', title: `Notification ${i + 1}`, message: i === count - 1 ? 'Newest, nearest the edge.' : undefined }));

/** The real region, fixed to the block-end edge (inline-end corner from 48rem). */
export const Stacked: Story = {
  args: { count: 3 },
  parameters: { layout: 'fullscreen', vrt: { viewports: [375, 1280] } },
  render: ({ count = 3 }) => (
    <div style={{ padding: '1rem' }}>
      <p>Page content. Toasts never cover the focused element: scroll padding keeps it above the stack.</p>
      <ToastRegion toasts={stack(count)} onDismiss={noop} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Notifications' });
    const visible = within(region).getAllByText(/^Notification \d$/);
    await expect(visible).toHaveLength(Math.min(3, args.count ?? 3));
  },
};

export const StackedOne: Story = { ...Stacked, args: { count: 1 } };

/** Five toasts: the newest three show, the older two collapse behind "+2 more". */
export const StackedFive: Story = {
  ...Stacked,
  args: { count: 5 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const more = canvas.getByRole('button', { name: '+2 more' });
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByText('Notification 1')).toBeNull();
    await expect(canvas.getByText('Notification 5')).toBeVisible();
  },
};

/** Urgent toasts use role="alert"; the rest live in the polite role="status" container. */
export const Urgent: Story = {
  parameters: { layout: 'fullscreen', vrt: { viewports: [375, 1280] } },
  render: () => (
    <ToastRegion
      toasts={[
        { id: 'a', tone: 'success', title: 'Promo code applied' },
        { id: 'b', tone: 'danger', title: 'Payment failed', message: 'Your card was declined. No money was taken.', urgent: true },
      ]}
      onDismiss={noop}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Payment failed');
    await expect(canvas.getByRole('status')).toHaveTextContent('Promo code applied');
    await expect(canvas.getByRole('status')).not.toHaveTextContent('Payment failed');
  },
};

function Live() {
  const { toasts, show, dismiss } = useToasts();
  return (
    <div style={{ padding: '1rem' }}>
      <Button onClick={() => show({ tone: 'success', title: 'Added to cart', message: 'Stoneware mug' })}>Add to cart</Button>
      <ToastRegion toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

/** useToasts(): a toast appears without taking focus and is dismissed with its button. */
export const ShowAndDismiss: Story = {
  parameters: { layout: 'fullscreen', vrt: { screenshot: false } },
  render: () => <Live />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Notifications' });
    await expect(within(region).getByRole('status')).toBeEmptyDOMElement();
    const add = canvas.getByRole('button', { name: 'Add to cart' });
    await userEvent.click(add);
    await expect(within(region).getByRole('status')).toHaveTextContent('Added to cart');
    await expect(add).toHaveFocus(); // no focus theft
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss: Added to cart' }));
    await waitFor(() => expect(within(region).getByRole('status')).toBeEmptyDOMElement());
  },
};
