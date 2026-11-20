import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { breadcrumbTrails } from '../../fixtures/navigation';
import { Breadcrumbs } from './Breadcrumbs';

const meta = {
  title: 'Navigation/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['vrt-full'],
  args: { items: breadcrumbTrails.three },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneItem: Story = {
  args: { items: breadcrumbTrails.one },
};

export const TwoItems: Story = {
  args: { items: breadcrumbTrails.two },
};

export const ThreeItems: Story = {
  play: async ({ canvasElement }) => {
    const current = within(canvasElement).getByText('Design systems');
    await expect(current).toHaveAttribute('aria-current', 'page');
  },
};

/** Six items. Below 40rem the middle three collapse into an ellipsis (still announced). */
export const SixItems: Story = {
  args: { items: breadcrumbTrails.six },
};

export const LongLabels: Story = {
  args: { items: breadcrumbTrails.longLabels },
};

/** Collapsed at mobile width: first item, ellipsis, last two. Hidden items stay in the accessibility tree. */
export const MobileCollapsed: Story = {
  args: { items: breadcrumbTrails.six },
  parameters: { vrt: { viewports: [375] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('listitem')).toHaveLength(6);
    await expect(canvas.getByRole('link', { name: 'Articles' })).toBeInTheDocument();
  },
};
