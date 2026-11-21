import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import layout from '../../stories/storyLayout.module.css';
import { DownloadList, type DownloadItem } from './DownloadList';

const meta = { title: 'Commerce/Checkout/DownloadList', component: DownloadList } satisfies Meta<typeof DownloadList>;
export default meta;
type Story = StoryObj<Record<string, never>>;

const one: DownloadItem[] = [{ fileId: 'guide-pdf', name: 'small-garden-guide.pdf', available: true, format: 'PDF', sizeBytes: 18_400_000 }];
const mixed: DownloadItem[] = [
  ...one,
  { fileId: 'plans', name: 'planting-plans.zip', available: true, format: 'ZIP', sizeBytes: 240_000_000, expiresAt: '2027-03-21' },
  { fileId: 'audio', name: 'a-very-long-file-name-for-the-companion-audio-walkthrough-of-every-season-in-the-garden.mp3', available: false, format: 'MP3', sizeBytes: 96_500_000 },
];
const twelve: DownloadItem[] = Array.from({ length: 12 }, (_, i) => ({ fileId: `plan-${i + 1}`, name: `garden-plan-${String(i + 1).padStart(2, '0')}.pdf`, available: true, format: 'PDF', sizeBytes: 1_200_000 + i * 310_000 }));

/** One file; available, expiring and unavailable files; twelve files. */
export const Matrix: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem', maxInlineSize: '40rem' }}>
      <div>
        <p className={layout.label}>One file</p>
        <DownloadList downloads={one} />
      </div>
      <div>
        <p className={layout.label}>Available, expiring, unavailable</p>
        <DownloadList downloads={mixed.map((d) => ({ ...d, fileId: `m-${d.fileId}` }))} />
      </div>
      <div>
        <p className={layout.label}>Twelve files</p>
        <DownloadList downloads={twelve} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Link expires Mar 21, 2027')).toBeVisible();
    const unavailable = canvas.getByRole('button', { name: /^Download a-very-long/ });
    await expect(unavailable).toHaveAttribute('aria-disabled', 'true');
    await expect(unavailable).toHaveAccessibleDescription('Available once your payment is confirmed.');
    // Demo links are "#" placeholders and never navigate.
    const link = canvas.getAllByRole('link', { name: 'Download small-garden-guide.pdf' })[0]!;
    await expect(link).toHaveAttribute('href', '#');
    const before = window.location.href;
    await userEvent.click(link);
    await expect(window.location.href).toBe(before);
  },
};
