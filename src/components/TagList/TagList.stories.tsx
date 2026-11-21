import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { categories, plainTags, tagLongLabel, tagsThree, tagsTwelve } from '../../fixtures/content';
import { CategoryFilter, TagList } from './TagList';

const meta = {
  title: 'Content/TagList',
  component: TagList,
  tags: ['vrt-mobile'],
  args: { items: tagsThree },
  render: (args) => (
    <div style={{ maxInlineSize: '40rem' }}>
      <TagList {...args} />
    </div>
  ),
} satisfies Meta<typeof TagList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeLinked: Story = {};

export const TwelveWrapping: Story = {
  args: { items: tagsTwelve },
};

export const LongLabel: Story = {
  args: { items: [...tagsThree, tagLongLabel] },
};

/** Without href: plain labels, not links. */
export const Plain: Story = {
  args: { items: plainTags, label: 'Article details' },
};

export const Small: Story = {
  args: { items: tagsTwelve, size: 'sm' },
};

/** Links mode: navigation with aria-current on the current category. Scrolls sideways when narrow. */
export const CategoryLinks: Story = {
  render: () => <CategoryFilter items={categories} selectedIds={['tax']} label="Blog categories" />,
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation', { name: 'Blog categories' });
    await expect(within(nav).getByRole('link', { name: /^Tax/ })).toHaveAttribute('aria-current', 'page');
    await expect(within(nav).getByRole('link', { name: /^Payroll/ })).not.toHaveAttribute('aria-current');
  },
};

/** Buttons mode (single choice): aria-pressed toggles; pressing the active one clears it. */
export const CategoryButtonsSingle: Story = {
  render: function Render() {
    const [selected, setSelected] = useState<string[]>(['all']);
    return <CategoryFilter mode="buttons" items={categories} selectedIds={selected} onChange={setSelected} label="Filter articles" />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const payroll = canvas.getByRole('button', { name: /^Payroll/ });
    await userEvent.click(payroll);
    await expect(payroll).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: /^All articles/ })).toHaveAttribute('aria-pressed', 'false');
  },
};

export const CategoryButtonsMultiple: Story = {
  render: function Render() {
    const [selected, setSelected] = useState<string[]>(['tax']);
    return <CategoryFilter mode="buttons" multiple items={categories} selectedIds={selected} onChange={setSelected} label="Filter articles" />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^Growth/ }));
    await expect(canvas.getByRole('button', { name: /^Tax/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: /^Growth/ })).toHaveAttribute('aria-pressed', 'true');
    // Keyboard focus stays visible inside the horizontal scroller.
    canvas.getByRole('button', { name: /^Company news/ }).focus();
  },
};
