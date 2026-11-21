import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { CartFixtureKey } from '../../fixtures';
import { cartView, lineHref, totalsFor } from '../../stories/cartStories';
import { CartIcon } from '../CartIcon';
import { MiniCart, type MiniCartProps } from './MiniCart';

type Args = { cart: CartFixtureKey; status?: MiniCartProps['status']; open?: boolean };

function Demo({ cart: key, status, open: startOpen = false }: Args) {
  const view = cartView(key);
  const [lines, setLines] = useState(view.cart.lines);
  const [open, setOpen] = useState(startOpen);
  const cart = { ...view.cart, lines };
  const totals = totalsFor(cart);
  return (
    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
      <CartIcon count={totals.itemCount} onClick={() => setOpen(true)} expanded={open} />
      <MiniCart
        open={open}
        onClose={() => setOpen(false)}
        cart={cart}
        totals={totals}
        issues={view.issues}
        lineHref={lineHref}
        onQuantityChange={(id, q) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, quantity: q } : l)))}
        onRemove={(id) => setLines((ls) => ls.filter((l) => l.id !== id))}
        links={{ cart: '/cart', checkout: '/checkout', shop: '/shop' }}
        status={status}
      />
    </div>
  );
}

const meta = {
  title: 'Commerce/Cart/MiniCart',
  component: Demo,
  tags: ['vrt-mobile'],
  parameters: { layout: 'fullscreen' },
  args: { cart: 'physicalOnly' },
} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;

const openIt: Story['play'] = async ({ canvasElement }) => {
  await userEvent.click(within(canvasElement).getByRole('button', { name: /^Cart,/ }));
  await waitFor(() => expect(within(canvasElement.ownerDocument.body).getByRole('dialog')).toBeVisible());
};

/** Closed: only the cart button. */
export const Closed: Story = {};
export const Empty: Story = { args: { cart: 'empty' }, play: openIt };
export const OneLine: Story = { args: { cart: 'oneLine' }, play: openIt };
export const ThreeLines: Story = { args: { cart: 'physicalOnly' }, play: openIt };
/** Twenty lines: the list scrolls inside the drawer; header and footer stay put. */
export const TwentyLines: Story = { args: { cart: 'twentyLines' }, play: openIt };
/** A blocking issue: Checkout is aria-disabled with a visible reason. */
export const WithIssues: Story = {
  args: { cart: 'withOutOfStockLine' },
  play: async (context) => {
    await openIt(context);
    const dialog = within(within(context.canvasElement.ownerDocument.body).getByRole('dialog'));
    const checkout = dialog.getByRole('button', { name: 'Checkout' });
    await expect(checkout).toHaveAttribute('aria-disabled', 'true');
    await expect(checkout).toHaveAccessibleDescription('Fix the items marked above to check out.');
  },
};
export const Loading: Story = { args: { cart: 'physicalOnly', status: 'loading' }, play: openIt };
export const ErrorState: Story = { args: { cart: 'physicalOnly', status: 'error' }, play: openIt };

/** Count in the heading, focus trapped inside, Escape closes, focus returns to the cart button. */
export const KeyboardAndFocus: Story = {
  args: { cart: 'mixed' },
  parameters: { vrt: { screenshot: false } },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const opener = within(canvasElement).getByRole('button', { name: 'Cart, 5 items' });
    await userEvent.click(opener);
    const dialog = await body.findByRole('dialog', { name: 'Your cart (5 items)' });
    await waitFor(() => expect(dialog).toContainElement(canvasElement.ownerDocument.activeElement as HTMLElement));
    // showModal makes the page inert: Tab cycles through the dialog (and the browser's own UI, where
    // activeElement is <body>), never into the page behind it.
    const doc = canvasElement.ownerDocument;
    for (let i = 0; i < 25; i++) {
      await userEvent.tab();
      const active = doc.activeElement;
      await expect(active === doc.body || dialog.contains(active)).toBe(true);
    }
    // Escape is delivered to the focused element, so finish with focus back inside the dialog.
    within(dialog).getByRole('button', { name: 'Close cart' }).focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(opener).toHaveFocus());
    await expect(body.queryByRole('dialog')).toBeNull();
  },
};

/** The stepper shows for physical lines only; removing the last line shows the empty state. */
export const RemoveLastLine: Story = {
  args: { cart: 'oneLine' },
  parameters: { vrt: { screenshot: false } },
  play: async (context) => {
    await openIt(context);
    const dialog = within(within(context.canvasElement.ownerDocument.body).getByRole('dialog'));
    await expect(dialog.getByRole('spinbutton', { name: 'Quantity' })).toHaveValue(1);
    await userEvent.click(dialog.getByRole('button', { name: 'Remove Stoneware mug from cart' }));
    await expect(dialog.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '/shop');
  },
};
