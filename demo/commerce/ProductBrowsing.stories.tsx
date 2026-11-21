import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState, type AnchorHTMLAttributes } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { LinkProvider } from '../../src/components/Link';
import { CollectionTemplate, ProductDetailTemplate, type CommerceContext } from '../../src/commerce';
import { candle, catalog, chrome, collectionPage, coffee, plannerApp, productPage, tee } from '../../src/commerce/fixtures';
import { useDemoCart } from './DemoCommerceProvider';
import { withDemoCommerce } from './withDemoCommerce';

/** Wires a template's callbacks to the demo cart, and shows the cart state for assertions. */
function useCartContext(): CommerceContext {
  const demo = useDemoCart();
  return useMemo(
    () => ({
      onAddToCart: ({ product, variantId, quantity, purchaseOption }) => demo.addLine(product, variantId, quantity, purchaseOption),
      onQuickAdd: (product, variant) => demo.addLine(product, variant.id),
    }),
    [demo],
  );
}

function CartReadout() {
  const { cart, totals } = useDemoCart();
  return (
    <output data-testid="cart" style={{ display: 'block', padding: '1rem', fontFamily: 'monospace' }}>
      {cart.lines.map((l) => `${l.productId}:${l.variantId}×${l.quantity}:${l.purchaseOption.type}`).join(', ') || 'empty'} | due today {totals.dueToday.amount}
    </output>
  );
}

function ProductWithCart({ name }: { name: 'tee' | 'coffee' | 'candle' | 'planner' }) {
  const ctx = useCartContext();
  const page = { tee: productPage(tee, undefined, { initialSelection: { Size: 'M', Colour: 'Moss' } }), coffee: productPage(coffee), candle: productPage(candle), planner: productPage(plannerApp) }[name];
  return (
    <>
      <ProductDetailTemplate page={page} chrome={chrome} ctx={ctx} />
      <CartReadout />
    </>
  );
}

/** DEMO ONLY: product pages and collections wired to the demo cart. Interaction-only (no screenshots). */
const meta = {
  title: 'Demo/Product browsing',
  parameters: { layout: 'fullscreen', vrt: { screenshot: false } },
  decorators: [withDemoCommerce()],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Choose a variant and quantity, add to cart: the demo cart gets the right line. */
export const AddVariantToCart: Story = {
  render: () => <ProductWithCart name="tee" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'L' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Increase quantity of Organic cotton tee' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Add to cart' }));
    await expect(canvas.getByTestId('cart')).toHaveTextContent('prod-tee:tee-l-moss×2:one-time');
    await expect(canvas.getByRole('button', { name: 'Added to cart' })).toBeVisible();
    await expect(canvas.getAllByRole('status').some((s) => s.textContent === 'Added Organic cotton tee to your cart.')).toBe(true);
  },
};

/** Subscribe and save adds a subscription line. */
export const SubscribeToCart: Story = {
  render: () => <ProductWithCart name="coffee" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'Subscribe and save 15%' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Subscribe' }));
    await expect(canvas.getByTestId('cart')).toHaveTextContent('prod-coffee:coffee-250×1:subscription');
  },
};

/** Stock-limited quantity: three candles at most. */
export const QuantityAtStockLimit: Story = {
  render: () => <ProductWithCart name="candle" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const plus = canvas.getByRole('button', { name: 'Increase quantity of Beeswax pillar candle' });
    await userEvent.click(plus);
    await userEvent.click(plus);
    await expect(plus).toBeDisabled();
    await expect(canvas.getByText('Only 3 available')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Add to cart' }));
    await expect(canvas.getByTestId('cart')).toHaveTextContent('prod-candle:candle-default×3');
  },
};

/** A trial subscription contributes nothing to "due today". */
export const TrialToCart: Story = {
  render: () => <ProductWithCart name="planner" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/You won’t be charged today/)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Start free trial' }));
    await expect(canvas.getByTestId('cart')).toHaveTextContent('prod-planner:planner-default×1:subscription | due today 0');
  },
};

/** Quick add from a collection card. */
export const QuickAddFromCollection: Story = {
  render: () => {
    function Collection() {
      const ctx = useCartContext();
      return (
        <>
          <CollectionTemplate page={collectionPage('base')} chrome={chrome} ctx={ctx} />
          <CartReadout />
        </>
      );
    }
    return <Collection />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add to cart: Stoneware mug' }));
    await expect(canvas.getByTestId('cart')).toHaveTextContent('prod-mug:mug-default×1');
  },
};

/** Browse flow for review: collection → product → back, with links only (a LinkProvider maps hrefs to state; no router). */
export const BrowseFlow: Story = {
  tags: ['skip-vrt'],
  render: () => {
    function Flow() {
      const [path, setPath] = useState('/shop');
      const ctx = useCartContext();
      const handle = path.startsWith('/products/') ? path.slice('/products/'.length) : undefined;
      const product = catalog.products.find((p) => p.handle === handle);
      const StateLink = ({ href = '', onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
        <a
          href={href}
          {...rest}
          onClick={(event) => {
            onClick?.(event);
            if (event.defaultPrevented || !href.startsWith('/')) return;
            event.preventDefault();
            setPath(href.split('?')[0]!);
            window.scrollTo(0, 0);
          }}
        />
      );
      return (
        <LinkProvider component={StateLink}>
          {product ? <ProductDetailTemplate key={product.id} page={productPage(product)} chrome={chrome} ctx={{ ...ctx, currentPath: path }} /> : <CollectionTemplate page={collectionPage('base')} chrome={chrome} ctx={{ ...ctx, currentPath: '/shop' }} />}
        </LinkProvider>
      );
    }
    return <Flow />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('link', { name: 'Organic cotton tee' }));
    await waitFor(() => expect(canvas.getByRole('heading', { level: 1, name: 'Organic cotton tee' })).toBeVisible());
    await userEvent.click(canvas.getAllByRole('link', { name: 'Shop' })[0]!);
    await waitFor(() => expect(canvas.getByRole('heading', { level: 1, name: 'Fernhill Goods' })).toBeVisible());
  },
};
