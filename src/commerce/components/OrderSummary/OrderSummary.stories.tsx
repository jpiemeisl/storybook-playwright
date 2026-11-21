import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { cartView, lineHref } from '../../stories/cartStories';
import { OrderSummary } from './OrderSummary';

const meta = { title: 'Commerce/Checkout/OrderSummary', component: OrderSummary, tags: ['vrt-mobile'] } satisfies Meta<typeof OrderSummary>;
export default meta;
type Story = StoryObj<Record<string, never>>;

const mixed = cartView('mixed');
const render = () => (
  <div style={{ maxInlineSize: '26rem' }}>
    <OrderSummary cart={mixed.cart} totals={mixed.totals} lineHref={lineHref} notes={mixed.notes} />
  </div>
);

/** Mixed cart. Wide screens hold it open; narrow screens start collapsed with the total in the summary line. */
export const Default: Story = {
  parameters: { vrt: { viewports: [375, { width: 1280, fullPage: true }] } },
  render,
};

/** Narrow: a native details toggle, closed by default, showing "Due today" while closed. */
export const ToggleOnNarrow: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }] } },
  render,
  play: async ({ canvasElement }) => {
    const details = canvasElement.querySelector('details')!;
    if (window.matchMedia('(min-width: 64rem)').matches) {
      await expect(details).toHaveAttribute('open');
      return;
    }
    await expect(details).not.toHaveAttribute('open');
    const summary = canvasElement.querySelector('summary')!;
    await expect(summary).toHaveTextContent('Due today: $85.05');
    await userEvent.click(summary);
    await expect(details).toHaveAttribute('open');
    await expect(within(details).getByRole('heading', { name: /Order summary/ })).toBeVisible();
    await expect(within(details).getByText('Then billed')).toBeVisible();
  },
};
