import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { groupedOptions, subjectOptions, subjectOptionsTwelve } from '../../fixtures/forms';
import { narrow } from '../../stories/inSection';
import { Field } from '../Field';
import { Select } from './Select';

const meta = {
  title: 'Forms/Select',
  component: Select,
  tags: ['vrt-mobile'],
  decorators: [narrow],
  args: { 'aria-label': 'Subject', options: subjectOptions, placeholder: 'Choose a subject' },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {};

export const Selected: Story = {
  args: { defaultValue: 'payroll' },
};

export const Focused: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('combobox')).toHaveFocus();
  },
};

/** <optgroup> groups, including a disabled option. */
export const Groups: Story = {
  args: { options: groupedOptions, placeholder: 'Choose a service' },
};

/** Twelve options with one very long label selected: the value truncates, the box keeps its width. */
export const LongOptionSelected: Story = {
  args: { options: subjectOptionsTwelve, defaultValue: 'cleanup' },
};

export const Disabled: Story = {
  args: { defaultValue: 'billing', disabled: true },
};

export const Invalid: Story = {
  render: () => (
    <Field label="Subject" required error="Choose a subject">
      <Select options={subjectOptions} placeholder="Choose a subject" />
    </Field>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--gap-md)' }}>
      <Select size="sm" aria-label="Small" options={subjectOptions} defaultValue="billing" />
      <Select size="md" aria-label="Medium" options={subjectOptions} defaultValue="billing" />
      <Select size="lg" aria-label="Large" options={subjectOptions} defaultValue="billing" />
    </div>
  ),
};
