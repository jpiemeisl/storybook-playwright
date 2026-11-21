import type { Meta, StoryObj } from '@storybook/react-vite';
import { formatMoney } from '../../utils/formatMoney';
import { catalog } from '../fixtures';
import { formatInterval } from '../logic/pricing';
import type { Product, PurchaseOption } from '../types/product';
import layout from './storyLayout.module.css';

const priceRange = (product: Product) => {
  const amounts = product.variants.map((v) => v.price.amount);
  const [min, max] = [Math.min(...amounts), Math.max(...amounts)];
  const currency = product.variants[0]!.price.currency;
  const f = (amount: number) => formatMoney({ amount, currency });
  return min === max ? f(min) : `${f(min)} – ${f(max)}`;
};

const option = (o: PurchaseOption) =>
  o.type === 'one-time' ? 'One-time' : `${formatInterval(o.interval)}${o.priceMultiplier ? ` ×${o.priceMultiplier}` : ''}${o.discountPercent ? ` −${o.discountPercent}%` : ''}${o.trialDays ? `, ${o.trialDays}-day trial` : ''}`;

const stock = (product: Product) => [...new Set(product.variants.map((v) => v.stock.status))].join(', ');

/** Every catalogue product at a glance. Not screenshotted; play and a11y checks still run. */
const meta = {
  title: 'Commerce/Fixtures overview',
  parameters: { vrt: { screenshot: false } },
  render: () => (
    <div className={layout.tableWrap} tabIndex={0} role="region" aria-label="Product fixtures">
      <table className={layout.table}>
        <caption>Fernhill Goods catalogue: {catalog.products.length} products, {catalog.collections.length} collections</caption>
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Kind</th>
            <th scope="col">Options</th>
            <th scope="col">Variants</th>
            <th scope="col">Price</th>
            <th scope="col">Purchase options</th>
            <th scope="col">Stock</th>
            <th scope="col">Rating</th>
          </tr>
        </thead>
        <tbody>
          {catalog.products.map((product) => (
            <tr key={product.id}>
              <th scope="row">
                {product.title}
                <br />
                <code>{product.id}</code>
              </th>
              <td>{product.kind}</td>
              <td>{product.options.map((o) => `${o.name} (${o.values.length})`).join(', ') || '–'}</td>
              <td>{product.variants.length}</td>
              <td>{priceRange(product)}</td>
              <td>{product.purchaseOptions.map(option).join('; ')}</td>
              <td>{stock(product)}</td>
              <td>{product.rating ? `${product.rating.average} (${product.rating.count})` : '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Catalogue: Story = {};
