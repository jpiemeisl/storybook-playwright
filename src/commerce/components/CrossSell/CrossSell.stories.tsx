import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { candle, guide, mug, seedPacket, tote } from '../../fixtures';
import { defaultProductHref } from '../../types/context';
import { CrossSell } from './CrossSell';

const meta = { title: 'Commerce/Cart/CrossSell', component: CrossSell } satisfies Meta<typeof CrossSell>;
export default meta;
type Story = StoryObj<typeof meta>;

/** RelatedProducts with the "Complete your order" heading. */
export const Default: Story = {
  args: { products: [candle, seedPacket, tote, guide, mug], hrefFor: defaultProductHref, onQuickAdd: () => undefined },
  play: async ({ canvasElement }) => {
    // The heading names the section through a generated id (no fixed id that two instances would share).
    const section = within(canvasElement).getByRole('region', { name: 'Complete your order' });
    await expect(section.getAttribute('aria-labelledby')).not.toBe('related-products');
  },
};
