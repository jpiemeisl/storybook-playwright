import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { Link } from '../Link';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Divider } from './Divider';

const meta = {
  title: 'Primitives/Divider',
  component: Divider,
  args: { orientation: 'horizontal' },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <Stack gap="md">
      <Text>Billing details are saved to your account.</Text>
      <Divider {...args} />
      <Text>Shipping details can be changed at checkout.</Text>
    </Stack>
  ),
};

export const HorizontalWithLabel: Story = {
  render: (args) => (
    <Stack gap="md" style={{ maxInlineSize: '24rem' }}>
      <Button>Continue with email</Button>
      <Divider {...args} label="or" />
      <Button variant="secondary">Continue as guest</Button>
    </Stack>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Stack direction="row" gap="md" align="center">
      <Link href="/privacy">Privacy</Link>
      <Divider orientation="vertical" />
      <Link href="/terms">Terms</Link>
      <Divider orientation="vertical" />
      <Link href="/cookies">Cookies</Link>
    </Stack>
  ),
};

export const VerticalWithLabel: Story = {
  render: () => (
    <Stack direction="row" gap="md" align="stretch" style={{ blockSize: '10rem' }}>
      <Text style={{ alignSelf: 'center' }}>Sign in with your work account.</Text>
      <Divider orientation="vertical" label="or" />
      <Text style={{ alignSelf: 'center' }}>Request a one-time code by email.</Text>
    </Stack>
  ),
};
