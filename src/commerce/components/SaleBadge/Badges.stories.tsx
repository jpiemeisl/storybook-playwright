import type { Meta, StoryObj } from '@storybook/react-vite';
import { Container } from '../../../components/Container';
import { Section, type SectionBackground } from '../../../components/Section';
import type { StockInfo } from '../../types/product';
import layout from '../../stories/storyLayout.module.css';
import { ProductTypeBadge } from '../ProductTypeBadge';
import { StockBadge } from '../StockBadge';
import { SaleBadge } from './SaleBadge';

const stocks: StockInfo[] = [
  { status: 'in-stock' },
  { status: 'low-stock', quantity: 3 },
  { status: 'low-stock' },
  { status: 'out-of-stock' },
  { status: 'backorder', availableOn: '2026-04-02' },
  { status: 'backorder' },
  { status: 'preorder', availableOn: '2026-06-01' },
  { status: 'preorder' },
];

function AllBadges() {
  return (
    <div className={layout.stack}>
      <div className={layout.row}>
        <SaleBadge percent={20} />
        <SaleBadge label="Sale" size="sm" />
        <SaleBadge label="2 for $30" />
      </div>
      <div className={layout.row}>
        {stocks.map((stock, i) => (
          <StockBadge key={i} stock={stock} />
        ))}
      </div>
      <div className={layout.row}>
        <ProductTypeBadge kind="digital" />
        <ProductTypeBadge kind="subscription" />
        <ProductTypeBadge kind="physical" showPhysical />
        <ProductTypeBadge kind="digital" size="sm" />
      </div>
    </div>
  );
}

const onBackground = (background: SectionBackground) => (
  <Section background={background}>
    <Container size="xl">
      <AllBadges />
    </Container>
  </Section>
);

const meta = {
  title: 'Commerce/Badges',
  tags: ['vrt-mobile'],
  parameters: { layout: 'fullscreen' },
  render: () => (
    <>
      {onBackground('default')}
      {onBackground('subtle')}
      {onBackground('accent')}
      {onBackground('inverse')}
    </>
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Sale, stock and product type badges on default, subtle, accent and inverse backgrounds. */
export const AllTogether: Story = {};

export const Sale: Story = { render: () => <div className={layout.row}><SaleBadge percent={20} /><SaleBadge label="Sale" /></div>, parameters: { layout: 'padded' } };
export const Stock: Story = {
  render: () => (
    <div className={layout.stack}>
      {stocks.map((stock, i) => (
        <StockBadge key={i} stock={stock} />
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
};
export const ProductType: Story = {
  render: () => (
    <div className={layout.row}>
      <ProductTypeBadge kind="digital" />
      <ProductTypeBadge kind="subscription" />
      <ProductTypeBadge kind="physical" />
      <ProductTypeBadge kind="physical" showPhysical />
    </div>
  ),
  parameters: { layout: 'padded' },
};
