import type { Meta, StoryObj } from '@storybook/react-vite';
import { cta } from '../../fixtures/sections';
import { inSection } from '../../stories/inSection';
import { CtaBanner } from './CtaBanner';

const meta = {
  title: 'Sections/CtaBanner',
  component: CtaBanner,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { ...cta, variant: 'accent', layout: 'centered' },
} satisfies Meta<typeof CtaBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Accent: Story = {};

export const Inverse: Story = {
  args: { variant: 'inverse' },
};

export const Subtle: Story = {
  args: { variant: 'subtle' },
};

/** Actions beside the text from 56rem; stacked below that. */
export const Split: Story = {
  args: { layout: 'split' },
};

export const SingleAction: Story = {
  args: { secondaryAction: undefined, body: undefined },
};

export const InverseOnInverseSection: Story = {
  args: { variant: 'inverse' },
  parameters: { surface: 'inverse' },
};

export const AccentOnAccentSection: Story = {
  args: { layout: 'split' },
  parameters: { surface: 'accent' },
};
