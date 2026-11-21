import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Content/EmptyState',
  component: EmptyState,
  args: {
    title: 'No posts in this category yet',
    message: 'New articles are added every month. In the meantime, browse everything we have written.',
    action: { label: 'See all posts', href: '/blog' },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const TitleOnly: Story = { args: { message: undefined, action: undefined, title: 'Enter a search term' } };
