import type { Meta, StoryObj } from '@storybook/react-vite';
import { candle, guide, mug, seedPacket, tote } from '../../fixtures';
import { defaultProductHref } from '../../types/context';
import { CrossSell } from './CrossSell';

const meta = { title: 'Commerce/Cart/CrossSell', component: CrossSell } satisfies Meta<typeof CrossSell>;
export default meta;
type Story = StoryObj<typeof meta>;

/** RelatedProducts with the "Complete your order" heading. */
export const Default: Story = {
  args: { products: [candle, seedPacket, tote, guide, mug], hrefFor: defaultProductHref, onQuickAdd: () => undefined },
};
