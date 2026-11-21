import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { cartPage, chrome, type CartFixtureKey } from '../../fixtures';
import { expectHeadingOutline } from '../../stories/browseStories';
import { lineHref } from '../../stories/cartStories';
import type { CartPage } from '../../types/pages';
import { CartTemplate } from './CartTemplate';

type Args = { cart: CartFixtureKey; extra?: Partial<CartPage> };

const noop = () => undefined;
const ctx = { currentPath: '/cart', lineHref, onQuantityChange: noop, onRemoveLine: noop, onSaveForLater: noop, onApplyPromo: () => ({ ok: true, message: 'Applied.' }), onRemovePromo: noop, onQuickAdd: noop };

const meta = {
  title: 'Commerce/Templates/Cart',
  parameters: { layout: 'fullscreen' },
  args: { cart: 'physicalOnly' },
  render: ({ cart, extra }: Args) => <CartTemplate page={cartPage(cart, extra)} chrome={chrome} ctx={ctx} />,
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;

const mobile = { layout: 'fullscreen', vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } };
const outline: Story['play'] = async ({ canvasElement }) => expectHeadingOutline(canvasElement);

export const Physical: Story = { tags: ['vrt-full'], parameters: { layout: 'fullscreen' }, play: outline };
export const Mixed: Story = { tags: ['vrt-full'], parameters: { layout: 'fullscreen' }, args: { cart: 'mixed' }, play: outline };
export const Empty: Story = { tags: ['vrt-full'], parameters: { layout: 'fullscreen' }, args: { cart: 'empty' }, play: outline };
export const Digital: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { cart: 'digitalOnly' } };
export const Subscription: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { cart: 'subscriptionWithTrial' } };
export const Loading: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { extra: { status: 'loading' } }, play: outline };
export const ErrorState: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { extra: { status: 'error' } } };
export const TwentyLines: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { cart: 'twentyLines' } };
export const PromoApplied: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { cart: 'withPromo' } };

/** Blocking issues: the alert links to each line (moving focus there) and Check out is disabled with a reason. */
export const WithIssues: Story = {
  tags: ['vrt-mobile'],
  parameters: mobile,
  args: { cart: 'withOutOfStockLine' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkout = canvas.getByRole('button', { name: 'Check out' });
    await expect(checkout).toHaveAttribute('aria-disabled', 'true');
    await expect(checkout).toHaveAccessibleDescription('Fix the items marked in your cart to check out.');
    await userEvent.click(canvas.getByRole('link', { name: /^Brass desk lamp: Out of stock/ }));
    await expect(canvasElement.ownerDocument.getElementById('line-l2')).toHaveFocus();
    await expectHeadingOutline(canvasElement);
  },
};
