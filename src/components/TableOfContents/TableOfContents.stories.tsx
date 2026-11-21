import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { articleToc } from '../../fixtures/content';
import { buildTocFromHeadings, TableOfContents } from './TableOfContents';

const meta = {
  title: 'Content/TableOfContents',
  component: TableOfContents,
  tags: ['vrt-mobile'],
  args: { items: articleToc },
  render: (args) => (
    <div style={{ maxInlineSize: '18rem' }}>
      <TableOfContents {...args} />
    </div>
  ),
} satisfies Meta<typeof TableOfContents>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Wide screens: always-open list. Narrow screens: a collapsed <details>. */
export const Default: Story = {};

/** aria-current="location" on the active link (thicker rule and weight, not colour alone). */
export const ActiveItem: Story = {
  args: { activeId: 'accruals' },
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation', { name: 'On this page' });
    const current = nav.querySelectorAll('[aria-current="location"]');
    // One visible (wide) or hidden (narrow) copy of the list is rendered per layout.
    await expect(current.length).toBeGreaterThan(0);
    for (const link of current) await expect(link).toHaveTextContent('Accruals in plain language');
  },
};

/** Narrow layout opened. */
export const NarrowExpanded: Story = {
  parameters: { vrt: { viewports: [375] } },
  play: async ({ canvasElement }) => {
    const details = canvasElement.querySelector('details');
    details?.setAttribute('open', '');
    await expect(details).toHaveAttribute('open');
  },
};

/** buildTocFromHeadings is pure: plain heading data in, TOC items out (levels 2-3 only). */
export const FromHeadings: Story = {
  args: {
    items: buildTocFromHeadings([
      { id: 'intro', text: 'Introduction', level: 2 },
      { id: 'setup', text: 'Setting up', level: 2 },
      { id: 'feeds', text: 'Bank feeds', level: 3 },
      { id: 'deep', text: 'Ignored level 4', level: 4 },
      { id: 'wrap', text: 'Wrapping up', level: 2 },
    ]),
  },
  play: async ({ args }) => {
    await expect(args.items.map((item) => item.id)).toEqual(['intro', 'setup', 'feeds', 'wrap']);
  },
};
