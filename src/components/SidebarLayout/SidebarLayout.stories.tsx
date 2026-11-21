import type { Meta, StoryObj } from '@storybook/react-vite';
import { Prose } from '../Prose';
import { TableOfContents } from '../TableOfContents';
import { SidebarLayout } from './SidebarLayout';

const meta = {
  title: 'Layout/SidebarLayout',
  component: SidebarLayout,
  tags: ['vrt-mobile'],
  args: {
    aside: (
      <TableOfContents
        items={[
          { id: 'one', label: 'Why five days', level: 2 },
          { id: 'two', label: 'Day 1: Reconcile', level: 2 },
          { id: 'three', label: 'Day 2: Receivables', level: 2 },
        ]}
      />
    ),
    children: (
      <Prose>
        <h2 id="one">Why five days</h2>
        <p>Five working days is long enough to wait for statements and short enough that the month is still fresh.</p>
        <h2 id="two">Day 1: Reconcile</h2>
        <p>Reconcile every bank and card account to its statement balance.</p>
        <h2 id="three">Day 2: Receivables</h2>
        <p>Chase anything more than thirty days overdue.</p>
      </Prose>
    ),
  },
} satisfies Meta<typeof SidebarLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AsideEnd: Story = {};
export const AsideStart: Story = { args: { asidePosition: 'start' } };
