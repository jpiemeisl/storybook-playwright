import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion } from '../../components/Accordion';
import { Alert } from '../../components/Alert';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Field } from '../../components/Field';
import { Input } from '../../components/Input';
import { Radio, RadioGroup } from '../../components/Radio';
import { Table } from '../../components/Table';
import { Tabs } from '../../components/Tabs';
import { Theme, themes } from '../../components/Theme';
import { Toast } from '../../components/Toast';
import { Price } from '../components/Price';
import { Rating } from '../components/Rating';
import { SaleBadge } from '../components/SaleBadge';
import { OrderStatusBadge, SubscriptionStatusBadge } from '../components/StatusBadge';
import { accountOrders, accountSubscriptions, DEMO_NOW } from '../fixtures';
import styles from './ThemeGallery.module.css';

/*
 * The cheap regression guard for themes: the same representative set of components inside each theme
 * panel. A component that forgets a token (hard-codes a colour, radius or border) stands out here.
 */

const usd = (amount: number) => ({ amount, currency: 'USD' });
const noop = () => undefined;

function Gallery({ name }: { name: (typeof themes)[number]['name'] }) {
  const id = `gallery-${name}`;
  return (
    <div className={styles.stack}>
      <div className={styles.row}>
        <Button size="sm">Primary</Button>
        <Button size="sm" variant="secondary">
          Secondary
        </Button>
        <Button size="sm" variant="ghost">
          Ghost
        </Button>
        <Button size="sm" disabled>
          Disabled
        </Button>
      </div>
      <Field id={`${id}-email`} label="Email" hint="We reply within a day.">
        <Input defaultValue="robin@example.com" />
      </Field>
      <Field id={`${id}-zip`} label="ZIP code" error="Enter a ZIP code like 97201">
        <Input defaultValue="9720" />
      </Field>
      <div className={styles.row}>
        <Badge>Neutral</Badge>
        <Badge tone="accent">Accent</Badge>
        <Badge tone="success">Success</Badge>
        <Badge tone="danger">Danger</Badge>
        <OrderStatusBadge order={accountOrders.shipped} />
        <SubscriptionStatusBadge subscription={accountSubscriptions.pastDue} now={DEMO_NOW} />
      </div>
      <Alert tone="info" title="Heads up">
        <p>Information alert with a <a href="#x">link</a>.</p>
      </Alert>
      <Alert tone="danger" title="Payment failed">
        Danger alert text.
      </Alert>
      <Card title="Card title" description="Card description on the surface colour." eyebrow="Eyebrow" href="#card" headingLevel={3} />
      <div className={styles.row}>
        <Price price={usd(1900)} compareAt={usd(2500)} />
        <SaleBadge percent={24} />
        <Rating value={4.4} count={128} />
      </div>
      <Table caption={`Orders (${name})`} hideCaption columns={[{ key: 'order', header: 'Order' }, { key: 'status', header: 'Status' }, { key: 'total', header: 'Total', numeric: true }]} rows={[{ order: 'FH-1001', status: 'Shipped', total: '$86.35' }]} />
      <RadioGroup legend="Plan" variant="card" name={`${id}-plan`} defaultValue="annual">
        <Radio value="monthly" label="Monthly" description="$20.00 / month" />
        <Radio value="annual" label="Annual" description="$192.00 / year" />
      </RadioGroup>
      <Tabs label={`Details (${name})`} tabs={[{ id: 'a', label: 'Description', content: <p>Tab panel content.</p> }, { id: 'b', label: 'Shipping', content: <p>Shipping.</p> }]} />
      <Accordion items={[{ id: `${id}-q`, title: `An open question (${name})`, content: <p>Accordion panel content.</p> }]} defaultExpanded={[`${id}-q`]} />
      <div className={styles.dialog} role="presentation">
        <p className={styles.dialogTitle}>Dialog surface</p>
        <p>Raised surface with the theme’s highest elevation.</p>
      </div>
      <Toast id={`${id}-toast`} tone="success" title="Added to cart" message="Stoneware mug" onDismiss={noop} />
    </div>
  );
}

const meta = { title: 'Themes/Component gallery', tags: ['vrt-full'], parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Gallery3Themes: Story = {
  name: 'All themes',
  tags: ['vrt-full'],
  render: () => (
    <div className={styles.grid}>
      {themes.map((t) => (
        <Theme key={t.name} name={t.name} className={styles.panel} role="group" aria-label={`${t.label} components`}>
          <h2 className={styles.title}>{t.label}</h2>
          <Gallery name={t.name} />
        </Theme>
      ))}
    </div>
  ),
};
