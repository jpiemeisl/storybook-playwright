import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { AnnouncementBar } from './AnnouncementBar';

const meta = {
  title: 'Navigation/AnnouncementBar',
  component: AnnouncementBar,
  tags: ['vrt-mobile'],
  parameters: { layout: 'fullscreen' },
  args: {
    message: 'New for 2026: payroll for seasonal teams of up to 60 people.',
    link: { label: 'See how it works', href: '/services/payroll' },
    tone: 'accent',
  },
} satisfies Meta<typeof AnnouncementBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Accent: Story = {};
export const Inverse: Story = { args: { tone: 'inverse' } };
export const Subtle: Story = { args: { tone: 'subtle' } };
export const WithoutLink: Story = { args: { link: undefined, message: 'Our office is closed on Monday 25 May.' } };

export const Dismissible: Story = { args: { dismissible: true, onDismiss: fn() } };

/** Uncontrolled: dismissal lives in component state only (no storage, no cookies). */
export const DismissedInMemory: Story = {
  args: { dismissible: true, onDismiss: fn() },
  parameters: { vrt: { screenshot: false } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss announcement' }));
    await expect(canvas.queryByRole('region', { name: 'Announcement' })).toBeNull();
    await expect(args.onDismiss).toHaveBeenCalledOnce();
  },
};

/** Controlled: the host decides (and persists) whether it is dismissed. */
export const ControlledDismissed: Story = {
  args: { dismissible: true, dismissed: true },
  parameters: { vrt: { screenshot: false } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('region', { name: 'Announcement' })).toBeNull();
  },
};

export const LongMessage: Story = {
  args: {
    dismissible: true,
    message: 'Scheduled maintenance: the client portal will be unavailable on Saturday from 10pm to 2am Eastern while we upgrade our document storage.',
    link: { label: 'Status page', href: '/status' },
  },
};
