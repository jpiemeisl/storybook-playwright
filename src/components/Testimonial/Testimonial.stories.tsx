import type { Meta, StoryObj } from '@storybook/react-vite';
import { testimonialLongLabels, testimonials } from '../../fixtures/sections';
import { inSection } from '../../stories/inSection';
import { Testimonial, TestimonialGrid } from './Testimonial';
import { vrtEdges } from '../../stories/vrt';

const meta = {
  title: 'Sections/Testimonial',
  component: Testimonial,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { ...testimonials[0]!, variant: 'single' },
} satisfies Meta<typeof Testimonial>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  parameters: { ...vrtEdges },
};

export const SingleWithoutAvatarOrLogo: Story = {
  parameters: { ...vrtEdges },
  args: { ...testimonials[2]! },
};

export const SingleLongLabels: Story = {
  args: { ...testimonialLongLabels },
};

export const Card: Story = {
  parameters: { ...vrtEdges },
  args: { variant: 'card' },
  render: (args) => (
    <div style={{ maxInlineSize: '26rem' }}>
      <Testimonial {...args} />
    </div>
  ),
};

export const GridOfThree: Story = {
  render: () => <TestimonialGrid items={testimonials} />,
};

export const GridOfTwo: Story = {
  render: () => <TestimonialGrid items={[testimonials[0]!, testimonialLongLabels]} />,
};

export const SingleOnInverseSection: Story = {
  parameters: { surface: 'inverse' },
};
