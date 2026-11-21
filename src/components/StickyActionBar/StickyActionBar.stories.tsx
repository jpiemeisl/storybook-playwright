import type { Meta, StoryObj } from '@storybook/react-vite';
import { StickyActionBar } from './StickyActionBar';

/** Only visible below 48rem: the default (desktop) capture is skipped; see the 375 capture. */
const meta = {
  title: 'Navigation/StickyActionBar',
  component: StickyActionBar,
  parameters: { layout: 'fullscreen', vrt: { viewports: [375] } },
  args: { action: { label: 'Book a payroll demo', href: '/contact' } },
} satisfies Meta<typeof StickyActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ButtonOnly: Story = {};
export const WithMessage: Story = { args: { message: 'Set up in a week' } };
