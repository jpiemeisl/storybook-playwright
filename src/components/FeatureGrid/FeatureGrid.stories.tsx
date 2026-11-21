import type { Meta, StoryObj } from '@storybook/react-vite';
import { features, featuresEdgeCases } from '../../fixtures/sections';
import { inSection } from '../../stories/inSection';
import { FeatureGrid } from './FeatureGrid';

const meta = {
  title: 'Sections/FeatureGrid',
  component: FeatureGrid,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: {
    items: features,
    columns: 3,
    layout: 'stacked',
    heading: 'Everything your books need, every month',
    intro: 'One flat monthly fee. No hourly billing, no surprise invoices at year end.',
  },
} satisfies Meta<typeof FeatureGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeColumns: Story = {};

export const TwoColumnsInlineIcon: Story = {
  args: { columns: 2, layout: 'inline-icon' },
};

export const FourColumns: Story = {
  args: { columns: 4, items: [...features, features[0]!, features[1]!].map((item, i) => ({ ...item, title: i > 5 ? `${item.title} (repeat)` : item.title })) },
};

export const WithoutHeading: Story = {
  args: { heading: undefined, intro: undefined },
};

/** One-word title, very long title, no icon, no description. */
export const EdgeCases: Story = {
  args: { items: featuresEdgeCases, heading: undefined, intro: undefined },
};

export const OneItem: Story = {
  args: { items: features.slice(0, 1) },
};

export const TwoItems: Story = {
  args: { items: features.slice(0, 2) },
};

export const SevenItems: Story = {
  args: { items: [...features, { icon: 'check', title: 'Audit support', description: 'If you are audited, we pull the records and join the call.' }] },
};

export const OnInverseSection: Story = {
  parameters: { surface: 'inverse' },
};
