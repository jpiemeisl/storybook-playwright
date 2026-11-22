/*
 * DEMO ONLY. Keyboard-only walkthroughs of the demo shop: Tab, Shift+Tab, Enter, Space, arrows and
 * Escape through userEvent.keyboard, never a pointer. Each step asserts where focus lands.
 * Behaviour tests: run by the visual suite (play + axe), never captured.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { checkoutValues } from '../../src/commerce/fixtures';
import { DemoShopApp } from './DemoShopApp';
import { canvasOf, expectH1, page } from './journeyHelpers';

const meta = {
  title: 'Demo shop/Keyboard',
  component: DemoShopApp,
  parameters: { layout: 'fullscreen', vrt: { screenshot: false } },
} satisfies Meta<typeof DemoShopApp>;
export default meta;
type Story = StoryObj<typeof meta>;

const active = (el: HTMLElement) => el.ownerDocument.activeElement as HTMLElement;
const nameOf = (node: HTMLElement) => (node.getAttribute('aria-label') ?? ((node as HTMLInputElement).labels?.[0]?.textContent || node.textContent) ?? '').trim();

/** Presses Tab until the focused element matches, failing after `max` presses. */
async function tabTo(el: HTMLElement, matches: (node: HTMLElement) => boolean, max = 120) {
  const seen: string[] = [];
  for (let i = 0; i < max; i += 1) {
    await userEvent.tab();
    if (matches(active(el))) return active(el);
    seen.push(`${active(el).tagName}:${nameOf(active(el)).slice(0, 30)}`);
  }
  throw new Error(`Focus never reached the target. Stops: ${[...new Set(seen)].join(' | ')}`);
}
const named = (role: string, name: string | RegExp) => (node: HTMLElement) => {
  const tag = node.tagName.toLowerCase();
  const roleOk = role === 'link' ? tag === 'a' : role === 'button' ? tag === 'button' : node.getAttribute('type') === role || node.getAttribute('role') === role;
  return roleOk && (typeof name === 'string' ? nameOf(node) === name : name.test(nameOf(node)));
};
const expectMainFocused = (el: HTMLElement) => waitFor(() => expect(active(el)).toBe(el.ownerDocument.getElementById('main')));

/** The skip link is the first stop and moves focus to <main>. */
export const SkipLink: Story = {
  args: { initialPath: '/' },
  play: async ({ canvasElement: el }) => {
    await userEvent.tab();
    await expect(active(el)).toHaveAccessibleName(/skip to (main )?content/i);
    await userEvent.keyboard('{Enter}');
    await expectMainFocused(el);
  },
};

/** Open the mini cart with Enter, close it with Escape: focus goes in, then back to the cart button. */
export const MiniCart: Story = {
  args: { initialPath: '/', initialCart: 'oneLine' },
  play: async ({ canvasElement: el }) => {
    const button = await tabTo(el, named('button', /^Cart, 1 item/));
    await userEvent.keyboard('{Enter}');
    const dialog = await page(el).findByRole('dialog', { name: 'Your cart (1 item)' });
    await waitFor(() => expect(dialog.contains(active(el))).toBe(true));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(page(el).queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(active(el)).toBe(button));
  },
};

/** A physical checkout with only the keyboard: product, add, mini cart, checkout steps, place order. */
export const PhysicalCheckout: Story = {
  args: { initialPath: '/products/stoneware-mug', initialCheckout: { ...checkoutValues.physical, paymentMethod: undefined, termsAccepted: false } },
  play: async ({ canvasElement: el }) => {
    const canvas = canvasOf(el);
    await expectH1(el, 'Stoneware mug');
    await tabTo(el, named('button', 'Add to cart'));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByRole('region', { name: 'Notifications' })).toHaveTextContent('Added to cart'));

    // Back up to the header's cart button and open the drawer.
    for (let i = 0; i < 120 && !named('button', /^Cart, 1 item/)(active(el)); i += 1) await userEvent.tab({ shift: true });
    await userEvent.keyboard('{Enter}');
    const drawer = await page(el).findByRole('dialog', { name: 'Your cart (1 item)' });
    for (let i = 0; i < 20 && !named('link', 'Checkout')(active(el)); i += 1) await userEvent.tab();
    await expect(active(el)).toHaveAccessibleName('Checkout');
    await expect(drawer.contains(active(el))).toBe(true);
    await userEvent.keyboard('{Enter}');
    await expectH1(el, 'Your information');
    await expectMainFocused(el);

    // Information is prefilled (a returning customer); continue with Enter.
    await tabTo(el, named('button', 'Continue to shipping'));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(active(el)).toHaveAccessibleName('Shipping method'));

    await tabTo(el, named('button', 'Continue to payment'));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(active(el)).toHaveAccessibleName('Payment'));

    // Payment: Space selects the card radio and ticks the terms.
    await tabTo(el, named('radio', /Credit or debit card/));
    await userEvent.keyboard(' ');
    await tabTo(el, (node) => node.id === 'checkout-terms');
    await userEvent.keyboard(' ');
    await expect(active(el)).toBeChecked();
    await tabTo(el, named('button', 'Continue to review'));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(active(el)).toHaveAccessibleName('Review your order'));

    await tabTo(el, named('button', 'Place order'));
    await userEvent.keyboard('{Enter}');
    await expectH1(el, 'Thank you for your order');
    await expectMainFocused(el);
    await expect(within(el).getByText('FH-2101', { selector: 'strong' })).toBeVisible();
  },
};
