import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import {
  bundle,
  calendar,
  candle,
  chrome,
  club,
  coffee,
  diningTable,
  guide,
  kettle,
  lamp,
  longTitle,
  mug,
  noImages,
  plannerApp,
  productPage,
  reviewsData,
  seedBox,
  seedPacket,
  socks,
  stool,
  tee,
  tote,
} from '../../fixtures';
import { expectHeadingOutline } from '../../stories/browseStories';
import type { ProductPage } from '../../types/pages';
import { ProductDetailTemplate } from './ProductDetailTemplate';

const pages: Record<string, ProductPage> = {
  simple: productPage(mug),
  variants: productPage(tee, reviewsData.forty, { initialSelection: { Size: 'M', Colour: 'Moss' } }),
  sale: productPage(tote),
  soldOut: productPage(lamp),
  lowStock: productPage(candle),
  backorder: productPage(stool),
  preorder: productPage(kettle),
  subscribeAndSave: productPage(coffee),
  digital: productPage(guide),
  bundle: productPage(bundle),
  monthly: productPage(seedBox),
  intervals: productPage(club),
  trial: productPage(plannerApp, reviewsData.none),
  free: productPage(calendar),
  longTitle: productPage(longTitle),
  noImages: productPage(noImages),
  fortyVariants: productPage(socks),
  extremeLow: productPage(seedPacket),
  extremeHigh: productPage(diningTable),
  noReviews: productPage(mug, reviewsData.none),
  manyReviews: productPage(tote, reviewsData.forty),
};

const meta = {
  title: 'Commerce/Templates/Product detail',
  tags: ['vrt-mobile'],
  parameters: { layout: 'fullscreen', vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  args: { name: 'simple' },
  render: ({ name }) => <ProductDetailTemplate page={pages[name]!} chrome={chrome} ctx={{ currentPath: `/products/${pages[name]!.product.handle}`, onAddToCart: () => undefined }} />,
  play: async ({ canvasElement }) => expectHeadingOutline(canvasElement),
} satisfies Meta<{ name: string }>;
export default meta;
type Story = StoryObj<typeof meta>;

const full = { tags: ['!vrt-mobile', 'vrt-full'], parameters: { vrt: undefined } };

export const PhysicalWithVariants: Story = { ...full, args: { name: 'variants' } };
export const DigitalSingleFile: Story = { ...full, args: { name: 'digital' } };
export const MonthlySubscription: Story = { ...full, args: { name: 'monthly' } };
export const SimplePhysical: Story = { args: { name: 'simple' } };
export const Sale: Story = { args: { name: 'sale' } };
export const SoldOut: Story = {
  args: { name: 'soldOut' },
  play: async ({ canvasElement }) => {
    await expectHeadingOutline(canvasElement);
    await expect(within(canvasElement).getByRole('button', { name: 'Sold out' })).toHaveAccessibleDescription(/sold out/);
  },
};
export const LowStock: Story = { args: { name: 'lowStock' } };
export const Backorder: Story = { args: { name: 'backorder' } };
export const PreOrder: Story = { args: { name: 'preorder' } };
export const SubscribeAndSave: Story = { args: { name: 'subscribeAndSave' } };
export const DigitalBundle: Story = { args: { name: 'bundle' } };
export const MultiIntervalSubscription: Story = { args: { name: 'intervals' } };
export const TrialSubscription: Story = { args: { name: 'trial' } };
export const FreeProduct: Story = { args: { name: 'free' } };
export const LongTitle: Story = {
  args: { name: 'longTitle' },
  play: async ({ canvasElement }) => {
    await expectHeadingOutline(canvasElement);
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};
export const NoImages: Story = { args: { name: 'noImages' } };
export const FortyVariants: Story = { args: { name: 'fortyVariants' } };
export const PriceLow: Story = { args: { name: 'extremeLow' } };
export const PriceHigh: Story = { args: { name: 'extremeHigh' } };
export const ZeroReviews: Story = { args: { name: 'noReviews' } };
export const FourThousandReviews: Story = { args: { name: 'manyReviews' } };

/** Choosing a colour updates the variant, the gallery image and the price line; a sold-out value is still selectable. */
export const SelectVariant: Story = {
  args: { name: 'variants' },
  parameters: { vrt: { viewports: [1280] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const colour = canvas.getByRole('radiogroup', { name: 'Colour' });
    await userEvent.click(within(colour).getByRole('radio', { name: 'Sand, sold out' }));
    await expect(canvas.getByRole('button', { name: 'Sold out' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(canvas.getByRole('radio', { name: 'L' }));
    await expect(within(colour).getByRole('radio', { name: 'Sand' })).toBeChecked();
    await expect(canvas.getByRole('button', { name: 'Add to cart' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: /Show image 2 of 2/ })).toHaveAttribute('aria-current', 'true');
    await expect(canvas.getByRole('radio', { name: 'XXL, not available with the other options chosen' })).toBeDisabled();
    window.scrollTo(0, 0);
  },
};

/** Switching to subscribe-and-save changes the price line and the button label. */
export const SwitchPurchaseOption: Story = {
  args: { name: 'subscribeAndSave' },
  parameters: { vrt: { viewports: [1280] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Add to cart' })).toBeVisible();
    await userEvent.click(canvas.getByRole('radio', { name: 'Subscribe and save 15%' }));
    await expect(canvas.getByRole('button', { name: 'Subscribe' })).toBeVisible();
    await expect(canvas.getAllByText('/ month').length).toBeGreaterThan(0);
    await expect(canvas.queryByRole('spinbutton', { name: 'Quantity' })).toBeNull();
    window.scrollTo(0, 0);
  },
};
