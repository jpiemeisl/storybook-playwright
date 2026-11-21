import type { Meta, StoryObj } from '@storybook/react-vite';
import { LinkList } from './LinkList';

const meta = {
  title: 'Navigation/LinkList',
  component: LinkList,
  args: {
    items: [
      { label: 'Pricing', href: '/pricing' },
      { label: 'Our services', href: '/services' },
      { label: 'The Brightside blog', href: '/blog' },
    ],
  },
} satisfies Meta<typeof LinkList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Column: Story = {};
export const Row: Story = { args: { direction: 'row', size: 'sm', label: 'Legal' } };
