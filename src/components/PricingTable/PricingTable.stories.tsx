import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { pricingEdgeCases, pricingTiers } from '../../fixtures/sections';
import { inSection } from '../../stories/inSection';
import { PricingTable } from './PricingTable';

const meta = {
  title: 'Sections/PricingTable',
  component: PricingTable,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { tiers: pricingTiers, annualSavingsLabel: 'Save 20%' },
} satisfies Meta<typeof PricingTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Monthly: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Monthly' })).toBeChecked();
    const growth = canvas.getByRole('article', { name: 'Growth' });
    await expect(growth).toHaveTextContent('$129');
    // Included/excluded is in text, not only in the icon.
    const essentials = canvas.getByRole('article', { name: 'Essentials' });
    await expect(essentials).toHaveTextContent('Not included: Payroll');
    await expect(essentials).toHaveTextContent('Included: Named accountant');
  },
};

/** Selecting Annual switches every tier with an annual price; Custom stays Custom. */
export const AnnualSelected: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const growth = canvas.getByRole('article', { name: 'Growth' });
    await expect(growth).toHaveTextContent('$129');
    await userEvent.click(canvas.getByRole('radio', { name: /Annual/ }));
    await expect(canvas.getByRole('radio', { name: /Annual/ })).toBeChecked();
    await expect(growth).toHaveTextContent('$1,238');
    await expect(growth).toHaveTextContent('per year');
    await expect(canvas.getByRole('article', { name: 'Multi-location' })).toHaveTextContent('Custom');
  },
};

/** Controlled: the parent owns the period (fixed to annual here). */
export const ControlledAnnual: Story = {
  args: { billingPeriod: 'year' },
};

/** Price 0 ("$0"), 1,249,900 cents one-time, 14 features vs 3, and price null ("Custom"). */
export const EdgeCases: Story = {
  args: { tiers: [pricingTiers[0]!, ...pricingEdgeCases] },
};

/** No tier has an annual price, so no toggle is shown. */
export const WithoutToggle: Story = {
  args: { tiers: pricingEdgeCases },
};

export const TwoTiers: Story = {
  args: { tiers: pricingTiers.slice(1, 3) },
};

export const OneTier: Story = {
  args: { tiers: pricingTiers.slice(2, 3), annualSavingsLabel: undefined },
};

export const OnInverseSection: Story = {
  parameters: { surface: 'inverse' },
};
