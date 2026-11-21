import type { Meta, StoryObj } from '@storybook/react-vite';
import { stats } from '../../fixtures/sections';
import { inSection } from '../../stories/inSection';
import { Stats } from './Stats';

const meta = {
  title: 'Sections/Stats',
  component: Stats,
  tags: ['vrt-mobile'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { items: stats },
} satisfies Meta<typeof Stats>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FourItems: Story = {};

export const WithHeading: Story = {
  args: { heading: 'Brightside in numbers' },
};

export const ThreeItems: Story = {
  args: { items: stats.slice(0, 3) },
};

export const TwoItems: Story = {
  args: { items: stats.slice(0, 2).map(({ value, label }) => ({ value, label })) },
};

export const OnInverseSection: Story = {
  args: { heading: 'Brightside in numbers' },
  parameters: { surface: 'inverse' },
};
