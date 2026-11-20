import type { Meta, StoryObj } from '@storybook/react-vite';
import { Section } from '../Section';
import { Stack } from '../Stack';
import { Badge, type BadgeProps, type BadgeTone } from './Badge';

const meta = {
  title: 'Primitives/Badge',
  component: Badge,
  args: { children: 'New', tone: 'neutral', size: 'md' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'accent', 'success', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

const tones: { tone: BadgeTone; label: string }[] = [
  { tone: 'neutral', label: 'Draft' },
  { tone: 'accent', label: 'Featured' },
  { tone: 'success', label: 'Published' },
  { tone: 'danger', label: 'Overdue' },
];

function AllTones(props: BadgeProps) {
  return (
    <Stack direction="row" gap="sm" wrap>
      {tones.map(({ tone, label }) => (
        <Badge key={tone} {...props} tone={tone}>
          {label}
        </Badge>
      ))}
    </Stack>
  );
}

export const Playground: Story = {
  tags: ['skip-vrt'],
};

export const Tones: Story = {
  render: (args) => <AllTones {...args} />,
};

export const Small: Story = {
  args: { size: 'sm' },
  render: (args) => <AllTones {...args} />,
};

export const OnInverse: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <Section background="inverse" padding="sm" style={{ paddingInline: 'var(--gutter)' }}>
      <AllTones {...args} />
    </Section>
  ),
};
