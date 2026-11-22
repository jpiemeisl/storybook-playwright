import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { addressBooks, wishlistProducts, wishlists } from '../../fixtures';
import { removeAddress, setDefaultAddress } from '../../logic/account';
import layout from '../../stories/storyLayout.module.css';
import { defaultProductHref } from '../../types/context';
import type { SavedAddress } from '../../types/account';
import { WishlistGrid } from '../WishlistGrid';
import { AddressBook } from './AddressBook';

type Args = { book: keyof typeof addressBooks };

function Live({ book }: Args) {
  const [addresses, setAddresses] = useState<SavedAddress[]>(addressBooks[book]);
  return (
    <div style={{ padding: '1rem' }}>
      <AddressBook
        addresses={addresses}
        onSave={(a) => setAddresses((list) => (a.id ? list.map((x) => (x.id === a.id ? ({ ...x, ...a } as SavedAddress) : x)) : [...list, { ...a, id: `adr-new-${list.length}` } as SavedAddress]))}
        onDelete={(id) => setAddresses((list) => removeAddress(list, id))}
        onSetDefault={(id, kind) => setAddresses((list) => setDefaultAddress(list, id, kind))}
      />
    </div>
  );
}

const meta = { title: 'Commerce/Account/AddressBook', component: Live, tags: ['vrt-mobile'], parameters: { layout: 'fullscreen' }, args: { book: 'three' } } satisfies Meta<typeof Live>;
export default meta;
type Story = StoryObj<typeof meta>;

/** One, three and ten addresses (at the limit, long names) and none. */
export const Matrix: Story = {
  parameters: { layout: 'fullscreen', vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {(['one', 'three', 'ten', 'none'] as const).map((book) => (
        <section key={book} aria-label={`${book} addresses`}>
          <p className={layout.label} style={{ paddingInline: '1rem' }}>
            {book}
          </p>
          <Live book={book} />
        </section>
      ))}
    </div>
  ),
};

const openWith = (name: string) => async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await userEvent.click(within(canvasElement).getByRole('button', { name }));
  await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByRole('dialog')).toBeVisible());
};

export const EditDialog: Story = { play: openWith('Edit Studio') };
export const DeleteDialog: Story = { play: openWith('Delete Parents') };

/** Make Studio the default for shipping: the badge moves and the change is announced. */
export const MakeDefault: Story = {
  parameters: { layout: 'fullscreen', vrt: { screenshot: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Make default for shipping: Studio' }));
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Studio is now your default shipping address.'));
    const studio = canvas.getByRole('heading', { name: 'Studio' }).closest('li')!;
    await expect(studio).toHaveTextContent('Default shipping');
    await expect(canvas.getByRole('heading', { name: 'Home' }).closest('li')).not.toHaveTextContent('Default shipping');
    await expect(canvas.queryByRole('button', { name: 'Make default for shipping: Studio' })).toBeNull();
  },
};

/** Delete with confirmation: focus returns to "Add address" and the change is announced. */
export const DeleteFlow: Story = {
  parameters: { layout: 'fullscreen', vrt: { screenshot: false } },
  play: async (context) => {
    await openWith('Delete Parents')(context);
    const body = within(context.canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole('button', { name: 'Delete address' }));
    const canvas = within(context.canvasElement);
    await waitFor(() => expect(canvas.queryByRole('heading', { name: 'Parents' })).toBeNull());
    await expect(canvas.getByRole('status')).toHaveTextContent('Deleted Parents.');
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Add address' })).toHaveFocus());
  },
};

function Wishlist({ initial }: { initial: keyof typeof wishlists }) {
  const [items, setItems] = useState(wishlists[initial]);
  return <WishlistGrid items={items} products={wishlistProducts} hrefFor={defaultProductHref} onRemove={(id) => setItems((list) => list.filter((i) => i.productId !== id))} onQuickAdd={() => undefined} />;
}

/** WishlistGrid: 3 and 14 items (with out-of-stock products) and empty. */
export const WishlistMatrix: Story = {
  name: 'WishlistGrid',
  parameters: { layout: 'fullscreen', vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={{ display: 'grid', gap: '2rem', padding: '1rem' }}>
      <Wishlist initial="three" />
      <Wishlist initial="fourteen" />
      <Wishlist initial="none" />
    </div>
  ),
};

/** Removing a wishlist item. */
export const RemoveFromWishlist: Story = {
  parameters: { layout: 'fullscreen', vrt: { screenshot: false } },
  render: () => <Wishlist initial="three" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Brass desk lamp from wishlist' }));
    await waitFor(() => expect(canvas.queryByRole('heading', { name: 'Brass desk lamp' })).toBeNull());
    await expect(canvas.getByText('2 products')).toBeVisible();
  },
};

