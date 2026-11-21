import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { hero, heroDeskMedia, heroLongHeadline } from '../../fixtures/sections';
import { inSection } from '../../stories/inSection';
import { Hero } from './Hero';

const meta = {
  title: 'Sections/Hero',
  component: Hero,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { ...hero, variant: 'centered' },
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Centered: Story = {};

export const CenteredWithoutMedia: Story = {
  args: { media: undefined },
};

export const Split: Story = {
  args: { variant: 'split', media: heroDeskMedia },
};

export const SplitMediaStart: Story = {
  args: { variant: 'split', media: heroDeskMedia, mediaPosition: 'start' },
};

/** On narrow slots the media can come before the text. */
export const SplitMediaFirstOnMobile: Story = {
  args: { variant: 'split', media: heroDeskMedia, mobileMediaOrder: 'first' },
};

/** Full-bleed image under a dark scrim; text and buttons switch to the inverse surface. */
export const Background: Story = {
  args: { variant: 'background' },
  parameters: { bare: true },
};

export const BackgroundLongHeadline: Story = {
  args: { ...heroLongHeadline, variant: 'background' },
  parameters: { bare: true },
};

export const LongHeadline: Story = {
  args: { ...heroLongHeadline, variant: 'split', media: heroDeskMedia },
};

export const OnInverseSection: Story = {
  args: { variant: 'split', media: heroDeskMedia },
  parameters: { surface: 'inverse' },
};

export const OnAccentSection: Story = {
  args: { media: undefined },
  parameters: { surface: 'accent' },
};

/** Keyboard focus on the primary action. */
export const ActionFocus: Story = {
  args: { variant: 'split', media: heroDeskMedia },
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('link', { name: 'Book a free consultation' })).toHaveFocus();
  },
};
