import type { Meta, StoryObj } from '@storybook/react-vite';
import { DescriptionList } from './DescriptionList';

const meta = {
  title: 'Content/DescriptionList',
  component: DescriptionList,
  tags: ['vrt-mobile'],
  args: {
    items: [
      { term: 'Client', details: 'Hearth & Crumb Bakery' },
      { term: 'Industry', details: 'Food and drink' },
      { term: 'Services', details: 'Catch-up bookkeeping, Monthly bookkeeping, Tax-ready reporting' },
    ],
  },
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Columns: Story = {};
export const Stacked: Story = { args: { layout: 'stacked' } };
