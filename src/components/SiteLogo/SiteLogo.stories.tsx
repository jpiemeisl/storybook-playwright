import type { Meta, StoryObj } from '@storybook/react-vite';
import { SiteLogo } from './SiteLogo';

const meta = {
  title: 'Navigation/SiteLogo',
  component: SiteLogo,
  args: { text: 'Brightside', href: '/' },
} satisfies Meta<typeof SiteLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithMark: Story = { args: { image: { src: '/fixtures/images/logo-mark.svg', alt: '', width: 32, height: 32 } } };
export const TextOnly: Story = {};
