import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ShareLinks } from './ShareLinks';

const url = 'https://brightside.example/blog/five-day-close';

const meta = {
  title: 'Content/ShareLinks',
  component: ShareLinks,
  tags: ['vrt-mobile'],
  args: { url, title: 'How to close your books in five working days' },
} satisfies Meta<typeof ShareLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'Share on LinkedIn (opens in a new tab)' });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link.getAttribute('href')).toContain(encodeURIComponent(url));
  },
};

export const EmailAndLinkedInOnly: Story = {
  args: { networks: ['linkedin', 'email'] },
};

/**
 * After "Copy link": success state plus a polite announcement. The clipboard is stubbed in the play
 * function so the result is deterministic in any browser.
 */
export const AfterCopy: Story = {
  play: async ({ canvasElement }) => {
    const copied: string[] = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text: string) => void copied.push(text) },
    });
    const canvas = within(canvasElement);
    const live = canvasElement.querySelector('[aria-live="polite"]');
    await expect(live).toHaveTextContent('');
    await userEvent.click(canvas.getByRole('button', { name: 'Copy link' }));
    await waitFor(() => expect(live).toHaveTextContent('Link copied'));
    await expect(copied).toEqual([url]);
    await expect(canvas.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  },
};
