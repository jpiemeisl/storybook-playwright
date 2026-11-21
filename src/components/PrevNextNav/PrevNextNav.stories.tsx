import type { Meta, StoryObj } from '@storybook/react-vite';
import { PrevNextNav } from './PrevNextNav';

const meta = {
  title: 'Navigation/PrevNextNav',
  component: PrevNextNav,
  tags: ['vrt-mobile'],
  args: {
    previous: { title: 'Cash flow forecasting for a growing agency', href: '/work/agency' },
    next: { title: 'Payroll for a growing physiotherapy clinic', href: '/work/clinic' },
    previousLabel: 'Previous case study',
    nextLabel: 'Next case study',
    'aria-label': 'More case studies',
  },
} satisfies Meta<typeof PrevNextNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Both: Story = {};
export const NextOnly: Story = { args: { previous: undefined } };
