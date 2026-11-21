import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { shippingMethods, shippingMethodsNone } from '../../fixtures';
import layout from '../../stories/storyLayout.module.css';
import { ShippingMethodSelector } from './ShippingMethodSelector';

const meta = { title: 'Commerce/Checkout/ShippingMethodSelector', component: ShippingMethodSelector } satisfies Meta<typeof ShippingMethodSelector>;
export default meta;
type Story = StoryObj<Record<string, never>>;

function Live({ free, initial }: { free?: string; initial?: string }) {
  const [value, setValue] = useState(initial);
  return <ShippingMethodSelector methods={shippingMethods} value={value} onChange={setValue} freeMethodIds={free ? [free] : undefined} name={`ship-${free ?? 'none'}`} />;
}

/** Three methods; free shipping applied to Standard; no methods available. */
export const Matrix: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={{ display: 'grid', gap: '2rem', maxInlineSize: '32rem' }}>
      <div>
        <p className={layout.label}>Three methods</p>
        <Live initial="ship-standard" />
      </div>
      <div>
        <p className={layout.label}>Free shipping applied</p>
        <Live free="ship-standard" initial="ship-standard" />
      </div>
      <div>
        <p className={layout.label}>None available</p>
        <ShippingMethodSelector methods={shippingMethodsNone} onChange={() => undefined} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const express = canvas.getAllByRole('radio', { name: /^Express/ })[0]!;
    await userEvent.click(express);
    await expect(express).toBeChecked();
    await expect(canvas.getByText('Free shipping applied (was $5.95)')).toBeVisible();
    await expect(canvas.getByText('No shipping methods available')).toBeVisible();
  },
};
