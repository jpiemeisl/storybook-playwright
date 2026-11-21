import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { consentLabel } from '../../fixtures/forms';
import { narrow } from '../../stories/inSection';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  tags: ['vrt-mobile'],
  decorators: [narrow],
  args: { label: 'Email me a copy of this message' },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Focused: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('checkbox')).toHaveFocus();
  },
};

export const WithDescription: Story = {
  args: { label: 'Payroll reminders', description: 'A reminder two days before each pay run, by email.' },
};

export const Required: Story = {
  args: { label: consentLabel, required: true },
};

export const WithError: Story = {
  args: { label: consentLabel, required: true, error: 'Tick the box to agree before sending' },
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--gap-sm)' }}>
      <Checkbox label="Disabled" disabled />
      <Checkbox label="Disabled and checked" disabled defaultChecked />
      <Checkbox label="Disabled and indeterminate" disabled indeterminate />
    </div>
  ),
};

export const LongLabelWraps: Story = {
  args: {
    label:
      'I confirm that the bank and card accounts listed above belong to the business, and that I am authorised to share read-only access to them with Brightside Bookkeeping for the purposes of preparing monthly accounts.',
  },
};

const months = ['January', 'February', 'March'];

/** Indeterminate: "Select all" shows mixed when some months are selected. */
export const Indeterminate: Story = {
  render: function Render() {
    const [selected, setSelected] = useState<string[]>(['January']);
    const all = selected.length === months.length;
    return (
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 'var(--gap-sm)' }}>
        <legend style={{ fontWeight: 'var(--text-weight-strong)', paddingBlockEnd: 'var(--gap-sm)' }}>Months to reconcile</legend>
        <Checkbox
          label="Select all"
          checked={all}
          indeterminate={selected.length > 0 && !all}
          onChange={() => setSelected(all ? [] : months)}
        />
        {months.map((month) => (
          <Checkbox
            key={month}
            label={month}
            checked={selected.includes(month)}
            onChange={() => setSelected((s) => (s.includes(month) ? s.filter((m) => m !== month) : [...s, month]))}
            style={{ marginInlineStart: 'var(--gap-lg)' }}
          />
        ))}
      </fieldset>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const selectAll = canvas.getByRole('checkbox', { name: 'Select all' });
    await expect(selectAll).toBePartiallyChecked();
    await userEvent.click(canvas.getByRole('checkbox', { name: 'February' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'March' }));
    await expect(selectAll).toBeChecked();
    await userEvent.click(canvas.getByRole('checkbox', { name: 'March' }));
    await expect(selectAll).toBePartiallyChecked();
  },
};
