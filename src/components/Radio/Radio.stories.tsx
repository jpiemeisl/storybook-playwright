import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Radio, RadioGroup } from './Radio';

const meta = {
  title: 'Forms/RadioGroup',
  component: RadioGroup,
  tags: ['vrt-mobile'],
  args: { legend: 'How should we contact you?' },
  render: (args) => (
    <div style={{ maxInlineSize: '40rem' }}>
      <RadioGroup {...args}>
        <Radio value="email" label="Email" />
        <Radio value="phone" label="Phone" />
        <Radio value="post" label="Post" />
      </RadioGroup>
    </div>
  ),
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {};

export const Selected: Story = {
  args: { defaultValue: 'phone' },
};

export const Horizontal: Story = {
  args: { orientation: 'horizontal', defaultValue: 'email' },
};

export const WithHintAndError: Story = {
  args: { required: true, hint: 'We reply within one working day.', error: 'Choose how we should contact you' },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'email' },
};

export const WithDescriptions: Story = {
  render: (args) => (
    <div style={{ maxInlineSize: '40rem' }}>
      <RadioGroup {...args} legend="Billing frequency" defaultValue="monthly">
        <Radio value="monthly" label="Monthly" description="Pay as you go. Cancel any time." />
        <Radio value="annual" label="Annual" description="Two months free, billed once a year." />
      </RadioGroup>
    </div>
  ),
};

/** Native keyboard behaviour: Tab into the group, Arrow keys move and select. */
export const KeyboardSelection: Story = {
  args: { defaultValue: 'email' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'Email' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('radio', { name: 'Phone' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Phone' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('radio', { name: 'Post' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Email' })).not.toBeChecked();
  },
};

const plans = [
  { value: 'starter', label: 'Starter: $0/month', description: 'One bank account and receipt capture.' },
  { value: 'essentials', label: 'Essentials: $49/month', description: 'Up to three accounts and a named accountant.' },
  { value: 'growth', label: 'Growth: $129/month', description: 'Unlimited accounts, payroll and tax filing.' },
];

/** Card variant: the whole card is clickable; checked = thick border + check icon (not colour alone). */
export const Cards: Story = {
  render: function Render() {
    const [plan, setPlan] = useState('essentials');
    return (
      <div style={{ maxInlineSize: '48rem' }}>
        <RadioGroup legend="Choose a plan" variant="card" orientation="horizontal" value={plan} onChange={setPlan}>
          {plans.map((p) => (
            <Radio key={p.value} {...p} />
          ))}
        </RadioGroup>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Unlimited accounts, payroll and tax filing.'));
    await expect(canvas.getByRole('radio', { name: 'Growth: $129/month' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Growth: $129/month' })).toHaveAccessibleDescription(
      'Unlimited accounts, payroll and tax filing.',
    );
  },
};

export const CardsVertical: Story = {
  render: () => (
    <div style={{ maxInlineSize: '28rem' }}>
      <RadioGroup legend="Delivery" variant="card" defaultValue="standard">
        <Radio value="standard" label="Standard (3-5 days)" description="Free" />
        <Radio value="express" label="Express (next day)" description="$12.00" />
        <Radio value="pickup" label="Collect from our office" description="Available from tomorrow at 10am" disabled />
      </RadioGroup>
    </div>
  ),
};
