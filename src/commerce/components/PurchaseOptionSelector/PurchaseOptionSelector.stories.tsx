import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Stack } from '../../../components/Stack';
import { club, coffee, plannerApp } from '../../fixtures';
import { defaultPurchaseOption } from '../../logic/options';
import type { Product, PurchaseOption } from '../../types/product';
import { BillingIntervalSelector, PurchaseOptionSelector } from './PurchaseOptionSelector';

function Cards({ product, initial }: { product: Product; initial?: PurchaseOption }) {
  const [value, setValue] = useState(initial ?? defaultPurchaseOption(product));
  return <PurchaseOptionSelector product={product} variant={product.variants[0]!} value={value} onChange={setValue} />;
}
function Intervals({ product, initial }: { product: Product; initial?: PurchaseOption }) {
  const [value, setValue] = useState(initial ?? defaultPurchaseOption(product));
  return <BillingIntervalSelector product={product} variant={product.variants[0]!} value={value} onChange={setValue} />;
}

const meta = { title: 'Commerce/PurchaseOptionSelector' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const OneTimeDefault: Story = { render: () => <Cards product={coffee} /> };
export const SubscribeSelected: Story = { render: () => <Cards product={coffee} initial={coffee.purchaseOptions[2]} /> };
export const Trial: Story = { render: () => <Cards product={plannerApp} /> };

/** Monthly, quarterly and annual with savings computed from the data ("Save 20% vs monthly"). */
export const ThreeIntervals: Story = {
  render: () => (
    <Stack gap="lg">
      <Intervals product={club} />
      <Intervals product={club} initial={club.purchaseOptions[2]} />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getAllByRole('radiogroup', { name: 'Billing interval' })[0]!;
    await expect(within(group).getByText('Save 20% vs monthly')).toBeVisible();
    await userEvent.click(within(group).getByRole('radio', { name: /Quarterly/ }));
    await expect(within(group).getByRole('radio', { name: /Quarterly/ })).toBeChecked();
  },
};
