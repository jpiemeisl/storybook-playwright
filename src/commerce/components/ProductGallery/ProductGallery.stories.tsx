import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import type { ImageRef } from '../../../content-types/shared';
import { catalog, mug, tee } from '../../fixtures';
import { ProductGallery } from './ProductGallery';

function Gallery({ images }: { images: ImageRef[] }) {
  const [index, setIndex] = useState(0);
  return (
    <div style={{ maxInlineSize: '36rem' }}>
      <ProductGallery images={images} index={index} onIndexChange={setIndex} title="Sample product" />
    </div>
  );
}

const twelve = catalog.products.flatMap((p) => p.images).filter((img, i, all) => all.findIndex((x) => x.src === img.src) === i).slice(0, 12);

const meta = { title: 'Commerce/ProductGallery', tags: ['vrt-mobile'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const NoImages: Story = { render: () => <Gallery images={[]} /> };
export const OneImage: Story = { render: () => <Gallery images={mug.images} /> };
export const ThreeImages: Story = {
  render: () => <Gallery images={[...tee.images, catalog.products[2]!.images[0]!]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const thumbs = canvas.queryAllByRole('button', { name: /Show image 2 of 3/ });
    if (!thumbs[0]?.checkVisibility()) return; // narrow: the strip is shown instead
    await userEvent.click(thumbs[0]);
    await expect(thumbs[0]).toHaveAttribute('aria-current', 'true');
  },
};
export const TwelveImages: Story = { render: () => <Gallery images={twelve} /> };
/** Narrow containers: a scroll-snap strip with dot buttons. */
export const MobileStrip: Story = { tags: ['!vrt-mobile'], parameters: { vrt: { viewports: [375] } }, render: () => <Gallery images={twelve.slice(0, 5)} /> };
