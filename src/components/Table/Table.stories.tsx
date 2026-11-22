import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { longTable, smallTable, wideTable } from '../../fixtures/content';
import { inSection } from '../../stories/inSection';
import { Table } from './Table';

const meta = {
  title: 'Data/Table',
  component: Table,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { caption: 'Plans and limits', columns: smallTable.columns, rows: smallTable.rows },
} satisfies Meta<typeof Table<(typeof smallTable.rows)[number]>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The scroll region is focusable (tabindex="0") and named by the caption. */
export const Small: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Plans and limits' });
    await expect(region).toHaveAttribute('tabindex', '0');
    await expect(within(region).getByRole('table', { name: 'Plans and limits' })).toBeInTheDocument();
    await expect(within(region).getByRole('columnheader', { name: 'Monthly price' })).toBeInTheDocument();
  },
};

export const Striped: Story = { tags: ['theme-smoke'],
  args: { striped: true },
};

/** Twelve numeric columns: scrolls horizontally with edge shadows; figures use tabular numerals. */
export const WideScrolling: Story = {
  render: () => (
    <Table caption="Monthly revenue by location (USD)" columns={wideTable.columns} rows={wideTable.rows} striped />
  ),
};

/** 60 rows with a sticky header inside a capped-height region; dense; empty and long cells. */
export const LongStickyHeaderDense: Story = {
  render: () => (
    <Table caption="March 2026 ledger" columns={longTable.columns} rows={longTable.rows} stickyHeader dense striped />
  ),
};

/** Empty cells show a dash; long text wraps inside its cell. */
export const EmptyAndLongCells: Story = {
  render: () => <Table caption="Ledger excerpt" columns={longTable.columns} rows={longTable.rows.slice(3, 9)} />,
};

/** Children instead of columns/rows, with a visually hidden caption. */
export const CustomMarkup: Story = {
  render: () => (
    <Table caption="Opening hours" hideCaption>
      <thead>
        <tr>
          <th scope="col">Day</th>
          <th scope="col">Hours</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Monday to Friday</th>
          <td>8:30am to 5:30pm</td>
        </tr>
        <tr>
          <th scope="row">Saturday</th>
          <td>By appointment</td>
        </tr>
      </tbody>
    </Table>
  ),
};

export const OnInverseSection: Story = {
  args: { striped: true },
  parameters: { surface: 'inverse' },
};
