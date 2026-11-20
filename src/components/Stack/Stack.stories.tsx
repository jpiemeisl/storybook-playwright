import type { Meta, StoryObj } from '@storybook/react-vite';
import { longUnbrokenString, Placeholder } from '../../stories/Placeholder';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Heading } from '../Heading';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { Stack } from './Stack';

const meta = {
  title: 'Layout/Stack',
  component: Stack,
  tags: ['vrt-full'],
  args: { direction: 'column', gap: 'md', align: 'stretch', justify: 'start', wrap: false },
  argTypes: {
    direction: { control: 'inline-radio', options: ['row', 'column'] },
    gap: { control: 'inline-radio', options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end', 'stretch', 'baseline'] },
    justify: { control: 'inline-radio', options: ['start', 'center', 'end', 'between'] },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  tags: ['skip-vrt'],
  args: {
    children: [
      <Placeholder key="1" title="First" />,
      <Placeholder key="2" title="Second" />,
      <Placeholder key="3" title="Third" />,
    ],
  },
};

export const Column: Story = {
  render: (args) => (
    <Stack {...args} style={{ maxInlineSize: '32rem' }}>
      <Heading size="xl">Contact preferences</Heading>
      <Text tone="muted">Choose how we get in touch about your project.</Text>
      <Placeholder title="Email updates">Weekly progress summary every Friday.</Placeholder>
      <Placeholder title="Phone">Only for urgent questions during working hours.</Placeholder>
    </Stack>
  ),
};

export const Row: Story = {
  args: { direction: 'row', gap: 'sm', wrap: true },
  render: (args) => (
    <Stack {...args}>
      <Button>Save</Button>
      <Button variant="secondary">Preview</Button>
      <Button variant="ghost">Cancel</Button>
    </Stack>
  ),
};

/** Cross-axis alignment: icon and text centred, badges on the baseline. */
export const Alignment: Story = {
  render: () => (
    <Stack gap="lg">
      <Stack direction="row" gap="sm" align="center">
        <Icon name="mail" />
        <Text>hello@example.com</Text>
      </Stack>
      <Stack direction="row" gap="sm" align="baseline">
        <Heading size="2xl">Pricing</Heading>
        <Badge tone="success">Updated</Badge>
      </Stack>
    </Stack>
  ),
};

/** `justify="between"` pushes groups apart; wraps onto two lines when narrow. */
export const SpaceBetween: Story = {
  args: { direction: 'row', justify: 'between', align: 'center', wrap: true },
  render: (args) => (
    <Stack {...args}>
      <Heading size="lg">Project dashboard</Heading>
      <Stack direction="row" gap="sm">
        <Button variant="secondary" size="sm">
          Export
        </Button>
        <Button size="sm">New project</Button>
      </Stack>
    </Stack>
  ),
};

/**
 * Edge case: a long URL with no spaces wraps inside its item instead of overflowing.
 * The label opts out of shrinking so only the URL column gives way.
 */
export const LongUnbrokenString: Story = {
  args: { direction: 'row', gap: 'md' },
  render: (args) => (
    <Stack {...args}>
      <div style={{ flexShrink: 0 }}>
        <Placeholder title="Short item" />
      </div>
      <Placeholder title="Webhook URL">{longUnbrokenString}</Placeholder>
    </Stack>
  ),
};

export const Nested: Story = {
  render: () => (
    <Stack gap="lg" style={{ maxInlineSize: '40rem' }}>
      <Stack gap="xs">
        <Heading size="lg">Workshop agenda</Heading>
        <Text tone="muted">Thursday, 9:30 to 16:00</Text>
      </Stack>
      <Stack direction="row" gap="md">
        <Placeholder title="Morning">Goals, users and constraints.</Placeholder>
        <Placeholder title="Afternoon">Sketching and prioritisation.</Placeholder>
      </Stack>
    </Stack>
  ),
};
