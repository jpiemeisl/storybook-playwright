import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { chrome, confirmationPage, type ConfirmationOrderKey } from '../../fixtures';
import { expectHeadingOutline } from '../../stories/browseStories';
import { lineHref } from '../../stories/cartStories';
import { OrderConfirmationTemplate } from './OrderConfirmationTemplate';

type Args = { order: ConfirmationOrderKey };

const meta = {
  title: 'Commerce/Templates/Order confirmation',
  parameters: { layout: 'fullscreen' },
  args: { order: 'physical' },
  render: ({ order }: Args) => <OrderConfirmationTemplate page={confirmationPage(order)} chrome={chrome} ctx={{ lineHref }} />,
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;

// Tags are written on each story: Storybook reads them statically, so spreading them in is ignored.
const mobile = { layout: 'fullscreen', vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } };

export const Physical: Story = { tags: ['vrt-mobile'], parameters: mobile };
export const Digital: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { order: 'digital' } };
export const SubscriptionTrial: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { order: 'subscriptionTrial' } };
/** Mixed: shipping, downloads and renewal copy together; a status alert; one h1. */
export const Mixed: Story = {
  tags: ['vrt-full'],
  parameters: { layout: 'fullscreen' },
  args: { order: 'mixed' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Thank you for your order');
    await expect(canvas.getByRole('status')).toHaveTextContent('We’ve received order FH-2004.');
    await expect(canvas.getByRole('link', { name: 'Download small-garden-guide.pdf' })).toBeVisible();
    // In "What happens next" and in "Then billed".
    await expect(canvas.getAllByText(/House coffee beans: \$23\.80 \/ month, next charge Apr 21, 2026/, { selector: 'li' })).toHaveLength(2);
    await expectHeadingOutline(canvasElement);
  },
};
export const LongNames: Story = { tags: ['vrt-mobile'], parameters: mobile, args: { order: 'longNames' } };
/** No email in the order: no "would be emailed" line. */
export const NoEmail: Story = {
  tags: ['vrt-mobile'],
  parameters: mobile,
  args: { order: 'noEmail' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText(/would be emailed/)).toBeNull();
  },
};
