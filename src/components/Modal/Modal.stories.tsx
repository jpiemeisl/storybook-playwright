import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../Button';
import { Text } from '../Text';
import { Modal, type ModalProps } from './Modal';

function ModalDemo(props: Omit<ModalProps, 'open' | 'onClose'>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <Modal
        {...props}
        open={open}
        onClose={() => setOpen(false)}
        footer={
          props.footer ?? (
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Pause plan</Button>
            </>
          )
        }
      />
    </>
  );
}

const meta = {
  title: 'Media/Modal',
  component: Modal,
  tags: ['vrt-mobile'],
  args: {
    open: false,
    onClose: () => {},
    title: 'Pause your plan?',
    description: 'We’ll stop monthly bookkeeping from 1 June. Your books and reports stay available.',
    size: 'md',
    children: <Text>You can restart at any time from Settings. Catch-up work for paused months is billed separately.</Text>,
  },
  render: ({ open: _open, onClose: _onClose, ...args }) => <ModalDemo {...args} />,
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

async function openModal(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }));
  const dialog = canvas.getByRole('dialog', { hidden: true });
  await waitFor(() => expect(dialog).toHaveAttribute('open'));
  return dialog;
}

export const Closed: Story = {};

/** Focus moves into the dialog on open; the dialog is named and described. */
export const Open: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await openModal(canvasElement);
    await expect(dialog).toHaveAccessibleName('Pause your plan?');
    await expect(dialog).toHaveAccessibleDescription('We’ll stop monthly bookkeeping from 1 June. Your books and reports stay available.');
    await expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();
  },
};

/** Escape closes it, scroll is restored and focus returns to the opener. */
export const EscapeReturnsFocus: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await openModal(canvasElement);
    await expect(document.documentElement.style.overflow).toBe('hidden');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
    await expect(document.documentElement.style.overflow).toBe('');
    await expect(within(canvasElement).getByRole('button', { name: 'Open dialog' })).toHaveFocus();
  },
};

export const Small: Story = {
  args: { size: 'sm', children: undefined },
  play: async ({ canvasElement }) => {
    await openModal(canvasElement);
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    title: 'Terms of the annual plan',
    children: (
      <div style={{ display: 'grid', gap: 'var(--gap-sm)' }}>
        {Array.from({ length: 6 }, (_, i) => (
          <Text key={i}>
            {i + 1}. The annual plan is billed once a year in advance. If you cancel, unused months are refunded pro rata
            within 14 days. Catch-up work is quoted separately.
          </Text>
        ))}
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    await openModal(canvasElement);
  },
};
