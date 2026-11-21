import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { map } from '../../fixtures/content';
import { fixtureImages } from '../../fixtures/images';
import { withIframeSrcCaptured } from '../../stories/embedTestUtils';
import { MapEmbed } from './MapEmbed';

const meta = {
  title: 'Media/MapEmbed',
  component: MapEmbed,
  tags: ['vrt-mobile'],
  args: map,
  render: (args) => (
    <div style={{ maxInlineSize: '48rem' }}>
      <MapEmbed {...args} />
    </div>
  ),
} satisfies Meta<typeof MapEmbed>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pre-activation: local pattern, address, "Show map" and a plain directions link. No iframe. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('iframe')).toBeNull();
    await expect(canvas.getByRole('link', { name: /Get directions/ })).toHaveAttribute('href', map.directionsHref);
  },
};

export const WithPlaceholderImage: Story = {
  args: { placeholder: fixtureImages.landscape },
};

/** Activation creates the iframe; its src is captured before it can load (never screenshotted). */
export const ActivationCreatesIframe: Story = {
  parameters: { vrt: { screenshot: false } },
  play: async ({ canvasElement }) => {
    const { intended } = await withIframeSrcCaptured(async () => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'Show map' }));
      await waitFor(() => expect(canvasElement.querySelector('iframe')).not.toBeNull());
    });
    await expect(intended).toEqual([map.src]);
    await expect(canvasElement.querySelector('iframe')).toHaveAttribute('title', map.title);
  },
};
