import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { smallTable } from '../../fixtures/content';
import { inSection } from '../../stories/inSection';
import { Table } from '../Table';
import { Text } from '../Text';
import { Tabs, type TabItem } from './Tabs';

const tabs: TabItem[] = [
  { id: 'overview', label: 'Overview', content: <Text>Monthly bookkeeping with a named accountant, reconciled by the 10th.</Text> },
  { id: 'pricing', label: 'Pricing', content: <Table caption="Plans" columns={smallTable.columns} rows={smallTable.rows} /> },
  { id: 'faq', label: 'FAQ', content: <Text>Yes, you can switch plans at any time; changes apply from the next month.</Text> },
  { id: 'reviews', label: 'Reviews', content: <Text>“The quarterly calls are the most useful hour of my quarter.”</Text> },
];

const manyTabs: TabItem[] = [
  'Overview', 'Bookkeeping', 'Payroll', 'Sales tax', 'Year-end', 'Software migration', 'Advisory', 'Support',
].map((label) => ({ id: label.toLowerCase().replace(/\s+/g, '-'), label, content: <Text>{label} content.</Text> }));

const meta = {
  title: 'Media/Tabs',
  component: Tabs,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { tabs, label: 'Service details' },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Wiring: tab aria-controls → panel id; panel aria-labelledby → tab id; only the selected tab is tabbable. */
export const Default: Story = { tags: ['theme-smoke'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tab = canvas.getByRole('tab', { name: 'Overview' });
    const panel = canvas.getByRole('tabpanel');
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(tab).toHaveAttribute('aria-controls', panel.id);
    await expect(panel).toHaveAttribute('aria-labelledby', tab.id);
    await expect(canvas.getByRole('tab', { name: 'Pricing' })).toHaveAttribute('tabindex', '-1');
  },
};

export const SecondSelected: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('tab', { name: 'Pricing' }));
    await expect(canvas.getByRole('tab', { name: 'Pricing' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel', { name: 'Pricing' })).toBeVisible();
  },
};

/** Automatic activation: arrows, Home and End move focus and select; focus ring visible. */
export const KeyboardAutomatic: Story = {
  // Behavior test: its screenshots were identical to SecondSelected's at every width, so it isn't captured.
  parameters: { vrt: { screenshot: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('tab', { name: 'Overview' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('tab', { name: 'Pricing' })).toHaveFocus();
    await expect(canvas.getByRole('tab', { name: 'Pricing' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('tab', { name: 'Reviews' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('tab', { name: 'Overview' })).toHaveFocus();
    await userEvent.keyboard('{Home}{ArrowRight}');
    await expect(canvas.getByRole('tab', { name: 'Pricing' })).toHaveFocus();
  },
};

/**
 * Manual activation: arrows move focus (and the roving tabindex) only; Enter or Space selects. Leaving
 * the tab list and coming back lands on the selected tab.
 */
export const KeyboardManual: Story = {
  // Behavior test: its screenshots were identical to SecondSelected's at every width, so it isn't captured.
  parameters: { vrt: { screenshot: false } },
  args: { activation: 'manual' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const overview = canvas.getByRole('tab', { name: 'Overview' });
    const pricing = canvas.getByRole('tab', { name: 'Pricing' });
    const faq = canvas.getByRole('tab', { name: 'FAQ' });
    await userEvent.tab();
    await expect(overview).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(pricing).toHaveFocus();
    await expect(pricing).toHaveAttribute('tabindex', '0');
    await expect(overview).toHaveAttribute('tabindex', '-1');
    await expect(overview).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowRight}');
    await expect(faq).toHaveFocus();
    await expect(faq).toHaveAttribute('tabindex', '0');
    await expect(pricing).toHaveAttribute('tabindex', '-1');
    await expect(overview).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel', { name: 'Overview' })).toBeVisible();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(pricing).toHaveFocus();
    await expect(overview).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{Enter}');
    await expect(pricing).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel', { name: 'Pricing' })).toBeVisible();
    await userEvent.keyboard('{ArrowRight}');
    await expect(faq).toHaveFocus();
    await expect(pricing).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard(' ');
    await expect(faq).toHaveAttribute('aria-selected', 'true');
    // Tab to the panel and back: focus returns to the selected tab.
    await userEvent.keyboard('{ArrowLeft}');
    await expect(pricing).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('tabpanel', { name: 'FAQ' })).toHaveFocus();
    await expect(faq).toHaveAttribute('tabindex', '0');
    await expect(pricing).toHaveAttribute('tabindex', '-1');
    await userEvent.tab({ shift: true });
    await expect(faq).toHaveFocus();
  },
};

export const Vertical: Story = {
  args: { orientation: 'vertical' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('tab', { name: 'Pricing' })).toHaveAttribute('aria-selected', 'true');
  },
};

/** Eight tabs: the tab list scrolls sideways on narrow containers. */
export const ManyTabs: Story = {
  args: { tabs: manyTabs, defaultValue: 'payroll' },
};

export const OnInverseSection: Story = {
  args: { defaultValue: 'pricing' },
  parameters: { surface: 'inverse' },
};
