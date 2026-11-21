import type { Meta, StoryObj } from '@storybook/react-vite';
import { cta } from '../../fixtures/sections';
import { inSection } from '../../stories/inSection';
import { CtaBanner } from './CtaBanner';
import { vrtEdges } from '../../stories/vrt';

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

export const Accent: Story = {
  parameters: { ...vrtEdges },
};

export const Inverse: Story = {
  parameters: { ...vrtEdges },
  args: { variant: 'inverse' },
};

export const Subtle: Story = {
  parameters: { ...vrtEdges },
  args: { variant: 'subtle' },
};

/** Actions beside the text from 56rem; stacked below that. */
export const Split: Story = {
  args: { layout: 'split' },
};

export const SingleAction: Story = {
  parameters: { ...vrtEdges },
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
