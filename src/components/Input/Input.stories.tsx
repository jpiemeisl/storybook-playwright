import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { longEmail } from '../../fixtures/forms';
import { narrow } from '../../stories/inSection';
import { Field } from '../Field';
import { Icon } from '../Icon';
import { Input } from './Input';

const meta = {
  title: 'Forms/Input',
  component: Input,
  tags: ['vrt-mobile'],
  decorators: [narrow],
  args: { placeholder: 'name@example.com', type: 'email', 'aria-label': 'Email address' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Filled: Story = {
  args: { defaultValue: 'priya@copperleaf.example' },
};

export const Focused: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('textbox')).toHaveFocus();
  },
};

export const Disabled: Story = {
  args: { defaultValue: 'priya@copperleaf.example', disabled: true },
};

export const ReadOnly: Story = {
  args: { defaultValue: 'priya@copperleaf.example', readOnly: true },
};

export const Invalid: Story = {
  render: () => (
    <Field label="Email address" required error="Enter an email address in the correct format, like name@example.com">
      <Input type="email" defaultValue="priya-at-copperleaf" />
    </Field>
  ),
};

export const WithAdornments: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--gap-md)' }}>
      <Field label="Email address">
        <Input type="email" startAdornment={<Icon name="mail" size="sm" />} placeholder="name@example.com" />
      </Field>
      <Field label="Monthly budget">
        <Input type="number" startAdornment="$" endAdornment="USD" defaultValue="1250" inputMode="decimal" />
      </Field>
      <Field label="Website">
        <Input type="url" startAdornment="https://" placeholder="example.com" />
      </Field>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--gap-md)' }}>
      <Input size="sm" aria-label="Small" placeholder="Small" />
      <Input size="md" aria-label="Medium" placeholder="Medium" />
      <Input size="lg" aria-label="Large" placeholder="Large" />
    </div>
  ),
};

export const Types: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--gap-md)' }}>
      <Field label="Text"><Input defaultValue="Copperleaf Studio" /></Field>
      <Field label="Telephone"><Input type="tel" autoComplete="tel" defaultValue="+1 (555) 014-2290" /></Field>
      <Field label="URL"><Input type="url" defaultValue="https://copperleaf.example" /></Field>
      <Field label="Password"><Input type="password" autoComplete="new-password" defaultValue="correct horse battery" /></Field>
      <Field label="Number of employees"><Input type="number" min={0} defaultValue="12" /></Field>
      <Field label="Start date"><Input type="date" defaultValue="2026-04-01" /></Field>
    </div>
  ),
};

/** A value longer than the field scrolls inside it and never widens the layout. */
export const LongValue: Story = {
  args: { defaultValue: longEmail },
};
