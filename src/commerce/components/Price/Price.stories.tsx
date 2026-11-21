import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import layout from '../../stories/storyLayout.module.css';
import { Price, type PriceProps } from './Price';

const usd = (amount: number) => ({ amount, currency: 'USD' });

const meta = {
  title: 'Commerce/Price',
  component: Price,
  args: { price: usd(2500) },
} satisfies Meta<typeof Price>;

export default meta;
type Story = StoryObj<typeof meta>;

const cases: [string, PriceProps][] = [
  ['Regular', { price: usd(2500) }],
  ['Sale', { price: usd(1900), compareAt: usd(2500) }],
  ['From', { price: usd(1200), from: true }],
  ['Monthly', { price: usd(900), interval: { unit: 'month', count: 1 } }],
  ['Quarterly', { price: usd(2400), interval: { unit: 'month', count: 3 } }],
  ['Annual', { price: usd(8640), interval: { unit: 'year', count: 1 } }],
  ['Trial', { price: usd(900), interval: { unit: 'month', count: 1 }, trialDays: 14 }],
  ['Subscribe and save', { price: usd(1615), compareAt: usd(1900), interval: { unit: 'week', count: 2 } }],
  ['Free', { price: usd(0) }],
  ['Unit price', { price: usd(1250), unitPrice: { price: usd(250), per: '100 g' } }],
  ['Extreme high', { price: usd(1249900), compareAt: usd(1499900) }],
  ['Low (99¢)', { price: usd(99) }],
];

/** Every state at each size. Below 48rem the matrix becomes a single column. */
export const Matrix: Story = {
  tags: ['vrt-mobile'],
  // Full page at both widths so the narrow-container row is captured too.
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div className={layout.stack}>
      <div className={layout.matrix}>
        <span className={layout.head}>State</span>
        <span className={layout.head}>sm</span>
        <span className={layout.head}>md</span>
        <span className={layout.head}>lg</span>
        {cases.map(([label, props]) => [
          <span key={`${label}-label`} className={layout.label}>
            {label}
          </span>,
          ...(['sm', 'md', 'lg'] as const).map((size) => <Price key={`${label}-${size}`} {...props} size={size} />),
        ])}
      </div>
      <p className={layout.label}>Narrow containers (9rem), large size: amounts wrap instead of overflowing.</p>
      <div className={layout.narrow}>
        <Price size="lg" price={usd(1249900)} compareAt={usd(1499900)} />
        <Price size="lg" price={{ amount: 1249900, currency: 'KWD' }} />
        <Price size="lg" price={{ amount: 124990000, currency: 'JPY' }} from />
        <Price size="md" price={usd(2400)} interval={{ unit: 'month', count: 3 }} trialDays={30} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

export const Regular: Story = {};

/** Announced as "Sale price $19.00, regular price $25.00". */
export const Sale: Story = {
  args: { price: usd(1900), compareAt: usd(2500), size: 'lg' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toBe('Sale price $19.00, regular price $25.00');
    await expect(canvasElement.querySelector('s')).toHaveTextContent('$25.00');
  },
};

export const FromPrice: Story = { name: 'From', args: { price: usd(1200), from: true } };
export const Monthly: Story = { args: { price: usd(900), interval: { unit: 'month', count: 1 } } };
export const WithTrial: Story = {
  args: { price: usd(900), interval: { unit: 'month', count: 1 }, trialDays: 14 },
  play: async ({ canvasElement }) => expect(within(canvasElement).getByText(/Free for 14 days/)).toBeVisible(),
};
export const Free: Story = { args: { price: usd(0) }, play: async ({ canvasElement }) => expect(canvasElement.textContent).toBe('Free') };
export const UnitPrice: Story = { args: { price: usd(1250), unitPrice: { price: usd(250), per: '100 g' } } };
export const Centered: Story = { args: { price: usd(1900), compareAt: usd(2500), align: 'center', size: 'lg' } };
