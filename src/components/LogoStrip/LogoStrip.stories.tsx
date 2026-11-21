import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { logos, logosMany } from '../../fixtures/sections';
import { inSection } from '../../stories/inSection';
import { LogoStrip } from './LogoStrip';

const meta = {
  title: 'Sections/LogoStrip',
  component: LogoStrip,
  tags: ['vrt-mobile'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { items: logos, heading: 'Trusted by 1,200 small businesses', grayscale: true },
} satisfies Meta<typeof LogoStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grayscale: Story = {};

export const FullColour: Story = {
  args: { grayscale: false },
};

/** Eight logos wrap onto as many rows as needed. */
export const ManyLogos: Story = {
  args: { items: logosMany },
};

/** A focused logo link returns to full colour and shows the focus ring. */
export const LinkFocus: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('link', { name: 'Northwind Outfitters' })).toHaveFocus();
  },
};

export const OnInverseSection: Story = {
  parameters: { surface: 'inverse' },
};
