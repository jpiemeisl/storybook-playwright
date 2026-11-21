import type { Meta, StoryObj } from '@storybook/react-vite';
import { authors } from '../../fixtures/content';
import { AuthorByline } from './AuthorByline';

const meta = {
  title: 'Content/AuthorByline',
  component: AuthorByline,
  tags: ['vrt-mobile'],
  args: { author: authors.ana, date: '2026-03-14', readingTime: '8 min read' },
  render: (args) => (
    <div style={{ maxInlineSize: '36rem' }}>
      <AuthorByline {...args} />
    </div>
  ),
} satisfies Meta<typeof AuthorByline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {};

/** No avatar: initials instead. */
export const InlineWithoutAvatar: Story = {
  args: { author: authors.noAvatar },
};

export const Block: Story = {
  args: { variant: 'block' },
};

export const BlockLongName: Story = {
  args: { variant: 'block', author: authors.longName },
};

/** Name only: no date, reading time, link or avatar. */
export const Minimal: Story = {
  args: { author: authors.minimal, date: undefined, readingTime: undefined },
};
