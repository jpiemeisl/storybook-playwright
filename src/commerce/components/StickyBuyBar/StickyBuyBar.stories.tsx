import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { checkoutPage, checkoutValues, chrome, lamp, productPage, tee } from '../../fixtures';
import { lineHref } from '../../stories/cartStories';
import { ProductDetailTemplate } from '../../templates/ProductDetailTemplate';
import { CheckoutTemplate } from '../../templates/CheckoutTemplate';
import { DemoPaymentFields } from '../PaymentMethodSelector';
import type { CheckoutStepId } from '../../types/checkout';

/*
 * The sticky purchase bars, in their templates at phone width. Each story scrolls the page so the real
 * action is out of view; the bar then shows the same control. Screenshots are viewport-sized so the bar
 * is pinned to the bottom edge as on a phone.
 */
const meta = { title: 'Commerce/StickyBuyBar', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj;

const phone = { layout: 'fullscreen', vrt: { viewports: [{ width: 375, height: 700 }] } };
const behaviour = { layout: 'fullscreen', vrt: { screenshot: false, viewports: [{ width: 375, height: 700 }] } };

const doc = (el: HTMLElement) => el.ownerDocument;
const bar = (el: HTMLElement) => doc(el).querySelector<HTMLElement>('[data-sticky-action-bar]');
const scrollPast = async (el: HTMLElement, target: HTMLElement) => {
  const win = doc(el).defaultView!;
  win.scrollTo(0, Math.max(target.getBoundingClientRect().bottom + win.scrollY + 40, doc(el).documentElement.scrollHeight));
  await waitFor(() => expect(bar(el)).not.toBeNull());
};
const realButton = (el: HTMLElement, name: string | RegExp) => within(el).getAllByRole('button', { name })[0]!;

/** Needs a narrow viewport: the bar never renders its content from 48rem. */
const requirePhone = (el: HTMLElement) => expect(doc(el).defaultView!.innerWidth).toBeLessThan(768);

function ProductPage({ product, selection }: { product: typeof tee; selection?: Record<string, string> }) {
  return <ProductDetailTemplate page={productPage(product, undefined, selection ? { initialSelection: selection } : {})} chrome={chrome} ctx={{ onAddToCart: () => undefined }} />;
}
const moss = { Size: 'M', Colour: 'Moss' };

/** Hidden while the real button is in view; scrolled past, the bar shows the title, price and the same button. */
export const ProductBar: Story = {
  parameters: phone,
  render: () => <ProductPage product={tee} selection={moss} />,
  play: async ({ canvasElement: el }) => {
    await requirePhone(el);
    const real = realButton(el, 'Add to cart');
    real.scrollIntoView({ block: 'center' });
    await waitFor(() => expect(bar(el)).toBeNull());
    await scrollPast(el, real);
    await expect(within(bar(el)!).getByText('Organic cotton tee')).toBeVisible();
    await expect(within(bar(el)!).getByRole('button', { name: 'Add to cart' })).toBeVisible();
  },
};

/** The bar's button is the same AddToCart: same label, same status after adding, one live region. */
export const ProductBarAddsToCart: Story = {
  parameters: behaviour,
  render: () => {
    function Page() {
      const [added, setAdded] = useState(0);
      return (
        <>
          <ProductDetailTemplate page={productPage(tee, undefined, { initialSelection: { Size: 'M', Colour: 'Moss' } })} chrome={chrome} ctx={{ onAddToCart: () => setAdded((n) => n + 1) }} />
          <output aria-label="Added count">{added}</output>
        </>
      );
    }
    return <Page />;
  },
  play: async ({ canvasElement: el }) => {
    await requirePhone(el);
    await scrollPast(el, realButton(el, 'Add to cart'));
    await userEvent.click(within(bar(el)!).getByRole('button', { name: 'Add to cart' }));
    await expect(within(el).getByLabelText('Added count')).toHaveTextContent('1');
    await waitFor(() => expect(within(bar(el)!).getByRole('button', { name: 'Added to cart' })).toBeVisible());
    await expect(within(el).getAllByText('Added Organic cotton tee to your cart.')).toHaveLength(1);
  },
};

/** Tabbing through everything after the bar appears: no focused control is ever behind the bar. */
export const ProductBarNeverCoversFocus: Story = {
  parameters: behaviour,
  render: () => <ProductPage product={tee} selection={moss} />,
  play: async ({ canvasElement: el }) => {
    await requirePhone(el);
    const real = realButton(el, 'Add to cart');
    await scrollPast(el, real);
    real.focus();
    const win = doc(el).defaultView!;
    let checked = 0;
    for (let i = 0; i < 80; i += 1) {
      await userEvent.tab();
      const focused = doc(el).activeElement as HTMLElement;
      const top = bar(el)?.getBoundingClientRect().top ?? win.innerHeight;
      if (focused === doc(el).body || bar(el)?.contains(focused)) continue;
      const rect = focused.getBoundingClientRect();
      if (rect.height === 0) continue;
      await expect(rect.bottom, `${focused.outerHTML.slice(0, 200)} is behind the bar (scroll parent: ${focused.closest("[class*=strip],[class*=track],[class*=scroller]")?.className ?? "none"})`).toBeLessThanOrEqual(top + 1);
      checked += 1;
    }
    await expect(checked).toBeGreaterThan(20);
  },
};

/** Sold out: the bar shows the status instead of a button. */
export const ProductBarSoldOut: Story = {
  parameters: phone,
  render: () => <ProductPage product={lamp} />,
  play: async ({ canvasElement: el }) => {
    await requirePhone(el);
    await scrollPast(el, realButton(el, 'Sold out'));
    await expect(within(bar(el)!).queryByRole('button')).toBeNull();
    await expect(bar(el)!).toHaveTextContent('Sold out');
  },
};

function Checkout({ step = 'information' as CheckoutStepId, onStep }: { step?: CheckoutStepId; onStep?: (s: CheckoutStepId) => void }) {
  return <CheckoutTemplate page={checkoutPage('mixed', step, checkoutValues.mixed)} chrome={chrome} ctx={{ lineHref, onCheckoutChange: () => undefined, onStepChange: onStep ?? (() => undefined), onPlaceOrder: () => undefined, paymentFields: <DemoPaymentFields /> }} />;
}

/** Checkout: the due-today total and the step's primary button, while the real one is out of view. */
export const CheckoutBar: Story = {
  parameters: phone,
  render: () => <Checkout />,
  play: async ({ canvasElement: el }) => {
    await requirePhone(el);
    const real = realButton(el, 'Continue to shipping');
    real.scrollIntoView({ block: 'center' });
    await waitFor(() => expect(bar(el)).toBeNull());
    doc(el).defaultView!.scrollTo(0, 0);
    await waitFor(() => expect(bar(el)).not.toBeNull());
    await expect(bar(el)!).toHaveTextContent(/Due today\s*\$94\.77/);
  },
};

/** The bar's button submits the same form (form attribute): validation and step change run once. */
export const CheckoutBarSubmitsTheForm: Story = {
  parameters: behaviour,
  render: () => {
    function Flow() {
      const [step, setStep] = useState<CheckoutStepId>('information');
      return <Checkout step={step} onStep={setStep} />;
    }
    return <Flow />;
  },
  play: async ({ canvasElement: el }) => {
    await requirePhone(el);
    doc(el).defaultView!.scrollTo(0, 0);
    await waitFor(() => expect(bar(el)).not.toBeNull());
    const submit = within(bar(el)!).getByRole('button', { name: 'Continue to shipping' });
    await expect(submit).toHaveAttribute('form', el.querySelector('form')!.id);
    await userEvent.click(submit);
    await expect(await within(el).findByRole('heading', { level: 1, name: 'Shipping method' })).toBeVisible();
  },
};
