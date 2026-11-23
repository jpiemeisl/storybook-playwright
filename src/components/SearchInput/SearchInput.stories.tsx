import { createRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SearchInput } from './SearchInput';

const meta = {
  title: 'Forms/SearchInput',
  component: SearchInput,
  tags: ['vrt-mobile'],
  args: { onSearch: fn(), label: 'Search articles', placeholder: 'Search articles' },
  render: (args) => (
    <div style={{ maxInlineSize: '32rem' }}>
      <SearchInput {...args} />
    </div>
  ),
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

/** With text the clear button appears. */
export const WithText: Story = {
  args: { defaultValue: 'sales tax' },
};

export const Focused: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('searchbox')).toHaveFocus();
  },
};

export const WithSubmitButton: Story = {
  args: { showSubmitButton: true, defaultValue: 'payroll' },
};

/** Enter calls onSearch with the trimmed query; Clear search empties the field and refocuses it. */
export const ClearAndSearch: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('search', { name: 'Search articles' })).toBeInTheDocument();
    const input = canvas.getByRole('searchbox', { name: 'Search articles' });
    await expect(canvas.queryByRole('button', { name: 'Clear search' })).toBeNull();
    await userEvent.type(input, '  receipts {Enter}');
    await expect(args.onSearch).toHaveBeenCalledWith('receipts');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));
    await expect(input).toHaveValue('');
    await expect(input).toHaveFocus();
    await expect(canvas.queryByRole('button', { name: 'Clear search' })).toBeNull();
  },
};

/** The input a caller's `ref` points at, checked by ClearWithCallerRef. */
const callerRef = createRef<HTMLInputElement>();

/** A caller's `ref` reaches the input, and Clear search still returns focus to it. */
export const ClearWithCallerRef: Story = {
  parameters: { vrt: { screenshot: false } },
  args: { defaultValue: 'invoices' },
  render: (args) => (
    <div style={{ maxInlineSize: '32rem' }}>
      <SearchInput {...args} ref={callerRef} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('searchbox', { name: 'Search articles' });
    await expect(callerRef.current).toBe(input);
    await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));
    await expect(input).toHaveValue('');
    await expect(input).toHaveFocus();
  },
};
