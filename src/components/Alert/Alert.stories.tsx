import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { serverErrorMessage } from '../../fixtures/forms';
import { Alert } from './Alert';

const meta = {
  title: 'Forms/Alert',
  component: Alert,
  tags: ['vrt-mobile'],
  args: { tone: 'info', title: 'Office closed on Monday', children: 'We’re closed for the public holiday. Replies resume on Tuesday.' },
  render: (args) => (
    <div style={{ maxInlineSize: '40rem' }}>
      <Alert {...args} />
    </div>
  ),
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tones: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--gap-md)', maxInlineSize: '40rem' }}>
      <Alert tone="info" title="Office closed on Monday">We’re closed for the public holiday. Replies resume on Tuesday.</Alert>
      <Alert tone="success" title="Message sent">We’ll reply within one working day.</Alert>
      <Alert tone="warning" title="Your card expires soon">Update your payment details before 31 May to avoid a missed payment.</Alert>
      <Alert tone="danger" title="Message not sent">{serverErrorMessage}</Alert>
    </div>
  ),
};

export const TitleOnly: Story = {
  args: { tone: 'success', title: 'Settings saved', children: undefined },
};

export const BodyOnly: Story = {
  args: { tone: 'warning', title: undefined, children: 'Payroll for March has not been approved yet.' },
};

/** role="status" by default; role="alert" only with `urgent`. */
export const Urgent: Story = {
  args: { tone: 'danger', urgent: true, title: 'Payment failed', children: 'Your card was declined. Update it to keep your plan active.' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent('Error: Payment failed');
  },
};

export const Dismissible: Story = {
  args: { onDismiss: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
    await expect(args.onDismiss).toHaveBeenCalledOnce();
  },
};

export const LongContent: Story = {
  args: {
    tone: 'warning',
    title: 'Some of your bank feeds need to be reconnected before we can close the books for this month',
    children:
      'Your bank asks you to re-approve read-only access every 90 days. Reconnect Northwind Credit Union business checking (ending 4471) and Tidewater Savings (ending 0932) from the Connections page, then we’ll pick up from where we left off.',
    onDismiss: () => {},
  },
};
