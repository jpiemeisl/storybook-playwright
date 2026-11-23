import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { libraries } from '../../fixtures';
import layout from '../../stories/storyLayout.module.css';
import { LicenseKey } from '../LicenseKey';
import { DownloadsLibrary, type DownloadsLibraryProps } from './DownloadsLibrary';

const meta = { title: 'Commerce/Account/DownloadsLibrary', component: DownloadsLibrary, tags: ['vrt-mobile'] } satisfies Meta<typeof DownloadsLibrary>;
export default meta;
type Story = StoryObj<Record<string, never>>;

function Searchable(props: Omit<DownloadsLibraryProps, 'query' | 'onQueryChange'> & { initial?: string }) {
  const [query, setQuery] = useState(props.initial ?? '');
  return <DownloadsLibrary {...props} query={query} onQueryChange={setQuery} />;
}
const cell = (label: string, children: React.ReactNode) => (
  <section aria-label={label}>
    <p className={layout.label}>{label}</p>
    {children}
  </section>
);

/** One product; six products with bundles, expired files and license keys (grouped by order); a filter with no match; empty. */
export const Matrix: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={{ display: 'grid', gap: '2.5rem', maxInlineSize: '48rem' }}>
      {cell('One product', <DownloadsLibrary items={libraries.one} headingLevel={3} />)}
      {cell('Six products, grouped by order', <Searchable items={libraries.six} groupBy="order" headingLevel={3} />)}
      {cell('Search with no match', <Searchable items={libraries.six} initial="tomato" headingLevel={3} />)}
      {cell('Empty', <DownloadsLibrary items={libraries.none} headingLevel={3} />)}
    </div>
  ),
};

/** License key: masked by default (not in the DOM), revealed by a toggle, copied with a polite message. */
export const LicenseKeyRevealAndCopy: Story = {
  parameters: { vrt: { viewports: [375, 1280] } },
  render: () => <LicenseKey value="GDTB-7Q4M-K2XP-9VNA" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement).not.toHaveTextContent('GDTB-7Q4M');
    await expect(canvas.getByText(/••••-••••-••••-9VNA/)).toBeVisible();
    const toggle = canvas.getByRole('button', { name: 'Show key' });
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText('GDTB-7Q4M-K2XP-9VNA')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(/copied|copy it/i));
    await expect(canvasElement.querySelector('[data-value], [value="GDTB-7Q4M-K2XP-9VNA"]')).toBeNull();
  },
};
