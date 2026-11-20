import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text, type TextSize, type TextTone } from './Text';

const meta = {
  title: 'Components/Text',
  component: Text,
  args: {
    children: 'The quick brown fox jumps over the lazy dog.',
    size: 'md',
    tone: 'default',
    weight: 'regular',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'subtle', 'danger', 'success'] },
    weight: { control: 'inline-radio', options: ['regular', 'strong'] },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

const stack = { display: 'grid', gap: 'var(--gap-sm)' } as const;
const sizes: TextSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const tones: TextTone[] = ['default', 'muted', 'subtle', 'danger', 'success'];

export const Playground: Story = {
  tags: ['skip-vrt'],
};

/** Fluid sizes change with viewport width, so this is also captured at mobile width. */
export const Sizes: Story = {
  tags: ['vrt-mobile'],
  render: (args) => (
    <div style={stack}>
      {sizes.map((size) => (
        <Text key={size} {...args} size={size}>
          {size}: {args.children}
        </Text>
      ))}
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div style={stack}>
      {tones.map((tone) => (
        <Text key={tone} {...args} tone={tone}>
          {tone}: {args.children}
        </Text>
      ))}
    </div>
  ),
};

export const Strong: Story = {
  args: { weight: 'strong' },
};

/** Renders as an inline `<span>` inside a paragraph via the `as` prop. */
export const AsSpan: Story = {
  render: (args) => (
    <Text {...args}>
      Paragraph text with an{' '}
      <Text as="span" weight="strong" tone="success">
        inline span
      </Text>{' '}
      rendered through the polymorphic <code>as</code> prop.
    </Text>
  ),
};

/** Long copy wraps; checked at mobile width. */
export const LongParagraph: Story = {
  tags: ['vrt-mobile'],
  args: {
    children:
      'Design tokens are the single source of truth for visual decisions. Components consume semantic aliases so that themes can change colour, type and spacing without touching component code. This paragraph is long enough to wrap across several lines at narrow widths.',
  },
};
