import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from '../../../components/Link';
import { EmptyCart } from './EmptyCart';

const meta = { title: 'Commerce/Cart/EmptyCart', component: EmptyCart } satisfies Meta<typeof EmptyCart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** With the recently-viewed slot filled. */
export const WithRecentlyViewed: Story = {
  args: {
    children: (
      <p>
        Recently viewed: <Link href="/products/stoneware-mug">Stoneware mug</Link>, <Link href="/products/waxed-canvas-tote">Waxed canvas tote</Link>
      </p>
    ),
  },
};
