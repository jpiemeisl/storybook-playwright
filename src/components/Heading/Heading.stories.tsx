import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading, type HeadingSize } from './Heading';

const meta = {
  title: 'Components/Heading',
  component: Heading,
  args: {
    children: 'Pattern library heading',
    size: 'xl',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['md', 'lg', 'xl', '2xl', '3xl', '4xl'] },
  },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

const stack = { display: 'grid', gap: 'var(--gap-md)' } as const;
const sizes: HeadingSize[] = ['4xl', '3xl', '2xl', 'xl', 'lg', 'md'];

export const Playground: Story = {
  tags: ['skip-vrt'],
};

/** Every size on the scale. Fluid, so also captured at mobile width. */
export const Sizes: Story = {
  tags: ['vrt-mobile'],
  render: (args) => (
    <div style={stack}>
      {sizes.map((size) => (
        <Heading key={size} {...args} size={size}>
          {size}: {args.children}
        </Heading>
      ))}
    </div>
  ),
};

/** Semantic level (`as`) and visual size are independent. */
export const LevelVersusSize: Story = {
  render: () => (
    <div style={stack}>
      <Heading as="h1" size="xl">
        An h1 styled at xl
      </Heading>
      <Heading as="h2" size="3xl">
        An h2 styled at 3xl
      </Heading>
    </div>
  ),
};

/** Long headings balance across lines; checked at mobile width. */
export const LongHeading: Story = {
  tags: ['vrt-mobile'],
  args: {
    size: '3xl',
    children: 'A considerably longer heading that will need to wrap onto several lines on small screens',
  },
};
