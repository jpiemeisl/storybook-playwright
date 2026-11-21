import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Stack } from '../../../components/Stack';
import { bundle, club, guide, mug, plannerApp, tee } from '../../fixtures';
import { DigitalDetails } from '../DigitalDetails';
import { ProductInfoAccordion } from '../ProductInfoAccordion';
import { RelatedProducts } from '../RelatedProducts';
import { WishlistButton } from '../WishlistButton';
import { catalog } from '../../fixtures';
import { DeliveryInfo, TrialBanner } from './DeliveryInfo';

const meta = { title: 'Commerce/Product details' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Delivery lines per kind, the trial banner, digital files and the wishlist toggle. */
export const DeliveryAndExtras: Story = {
  render: () => {
    function Wish() {
      const [saved, setSaved] = useState(false);
      return <WishlistButton pressed={saved} onPressedChange={setSaved} productTitle="Stoneware mug" />;
    }
    return (
      <Stack gap="lg" style={{ maxInlineSize: '28rem' }}>
        <DeliveryInfo product={mug} />
        <DeliveryInfo product={guide} />
        <DeliveryInfo product={club} purchaseOption={club.purchaseOptions[1]} />
        <TrialBanner trialDays={plannerApp.purchaseOptions[0]?.type === 'subscription' ? plannerApp.purchaseOptions[0].trialDays : undefined} />
        <DigitalDetails digital={bundle.digital} />
        <Wish />
      </Stack>
    );
  },
};

export const InfoAccordion: Story = {
  render: () => (
    <Stack gap="xl" style={{ maxInlineSize: '36rem' }}>
      <ProductInfoAccordion product={tee} />
      <ProductInfoAccordion product={bundle} />
      <ProductInfoAccordion product={club} />
    </Stack>
  ),
};

export const Related: Story = {
  tags: ['vrt-mobile'],
  parameters: { layout: 'padded' },
  render: () => <RelatedProducts products={catalog.products.slice(0, 8)} hrefFor={(p) => `/products/${p.handle}`} />,
};
