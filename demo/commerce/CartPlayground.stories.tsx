import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Button } from '../../src/components/Button';
import { Container } from '../../src/components/Container';
import { Heading } from '../../src/components/Heading';
import { Section } from '../../src/components/Section';
import { Stack } from '../../src/components/Stack';
import { Text } from '../../src/components/Text';
import { formatMoney } from '../../src/utils/formatMoney';
import { defaultSelection, Price, resolveVariant } from '../../src/commerce';
import { catalog } from '../../src/commerce/fixtures';
import { useDemoCart } from './DemoCommerceProvider';
import { withDemoCommerce } from './withDemoCommerce';
import styles from './CartPlayground.module.css';

/** DEMO ONLY: drives the demo cart and shows its state, totals and flags. */
function Playground() {
  const demo = useDemoCart();
  const { cart, totals } = demo;
  const row = (label: string, value: string, id: string) => (
    <div className={styles.row}>
      <dt>{label}</dt>
      <dd data-testid={id}>{value}</dd>
    </div>
  );

  return (
    <Section>
      <Container size="xl">
        <div className={styles.layout}>
          <Stack gap="lg">
            <Heading as="h1" size="2xl">
              Demo cart playground
            </Heading>
            <Text tone="muted">Demo only. In-memory state, fixed clock ({'2026-03-21'}), no network.</Text>
            <Stack as="section" gap="sm" aria-labelledby="pg-add">
              <Heading as="h2" size="lg" id="pg-add">
                Add products
              </Heading>
              <div className={styles.buttons}>
                {catalog.products.map((product) => {
                  const variant = resolveVariant(product, defaultSelection(product));
                  return (
                    variant && (
                      <Button key={product.id} size="sm" variant="secondary" onClick={() => demo.addLine(product, variant.id)}>
                        Add {product.title}
                      </Button>
                    )
                  );
                })}
              </div>
            </Stack>
            <Stack as="section" gap="sm" aria-labelledby="pg-actions">
              <Heading as="h2" size="lg" id="pg-actions">
                Actions
              </Heading>
              <div className={styles.buttons}>
                <Button size="sm" onClick={() => demo.applyPromo('WELCOME10')}>
                  Apply WELCOME10
                </Button>
                <Button size="sm" onClick={() => demo.applyPromo('SHIPFREE')}>
                  Apply SHIPFREE
                </Button>
                <Button size="sm" variant="secondary" onClick={() => demo.replaceCart('mixed')}>
                  Load mixed cart
                </Button>
                <Button size="sm" variant="ghost" onClick={demo.clear}>
                  Clear cart
                </Button>
              </div>
              {demo.lastAction && (
                <Text size="sm" role="status">
                  {demo.lastAction.message}
                </Text>
              )}
            </Stack>
            <Stack as="section" gap="sm" aria-labelledby="pg-lines">
              <Heading as="h2" size="lg" id="pg-lines">
                Lines ({cart.lines.length})
              </Heading>
              <ul className={styles.lines}>
                {cart.lines.map((line, i) => (
                  <li key={line.id} className={styles.line}>
                    <span>
                      {line.snapshot.title}
                      {line.snapshot.variantTitle ? ` (${line.snapshot.variantTitle})` : ''} × {line.quantity}
                    </span>
                    <Price size="sm" price={totals.lines[i]!.total} interval={line.purchaseOption.type === 'subscription' ? line.purchaseOption.interval : undefined} trialDays={line.purchaseOption.type === 'subscription' ? line.purchaseOption.trialDays : undefined} />
                    <span className={styles.buttons}>
                      <Button size="sm" variant="secondary" aria-label={`Decrease ${line.snapshot.title}`} onClick={() => demo.setQuantity(line.id, line.quantity - 1)}>
                        −
                      </Button>
                      <Button size="sm" variant="secondary" aria-label={`Increase ${line.snapshot.title}`} onClick={() => demo.setQuantity(line.id, line.quantity + 1)}>
                        +
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            </Stack>
          </Stack>
          <Stack gap="lg">
            <Stack as="section" gap="sm" aria-labelledby="pg-totals">
              <Heading as="h2" size="lg" id="pg-totals">
                Totals
              </Heading>
              <dl className={styles.list}>
                {row('Subtotal', formatMoney(totals.subtotal), 'subtotal')}
                {row('Discount', `-${formatMoney(totals.discount)}`, 'discount')}
                {row(totals.shippingEstimated ? 'Shipping (estimate)' : 'Shipping', formatMoney(totals.shipping), 'shipping')}
                {row('Estimated tax (demo 8%)', formatMoney(totals.tax), 'tax')}
                {row('Total', formatMoney(totals.total), 'total')}
                {row('Due today', formatMoney(totals.dueToday), 'dueToday')}
                {totals.recurring.map((r) => row('Then', r.label, `recurring-${r.startsAt}`))}
                {row('Free shipping', totals.freeShippingProgress.reached ? 'Reached' : `${formatMoney(totals.freeShippingProgress.remaining)} to go`, 'freeShipping')}
              </dl>
            </Stack>
            <Stack as="section" gap="sm" aria-labelledby="pg-flags">
              <Heading as="h2" size="lg" id="pg-flags">
                Flags
              </Heading>
              <dl className={styles.list}>
                {Object.entries(totals.flags).map(([key, value]) => row(key, String(value), `flag-${key}`))}
              </dl>
            </Stack>
            <Stack as="section" gap="sm" aria-labelledby="pg-json">
              <Heading as="h2" size="lg" id="pg-json">
                Cart state
              </Heading>
              <pre className={styles.json} tabIndex={0} aria-label="Cart state as JSON">
                {JSON.stringify(cart, null, 2)}
              </pre>
            </Stack>
          </Stack>
        </div>
      </Container>
    </Section>
  );
}

/**
 * Not screenshotted (`vrt.screenshot: false`); the visual harness still runs every play function and
 * the a11y check, so the assertions below run on every test run.
 */
const meta = {
  title: 'Demo/Cart playground',
  parameters: { layout: 'fullscreen', vrt: { screenshot: false } },
  decorators: [withDemoCommerce()],
  render: () => <Playground />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const value = (canvasElement: HTMLElement, id: string) => within(canvasElement).getByTestId(id);

export const Empty: Story = {};

/** Adding a physical, a digital and a subscription product sets isMixed. */
export const MixedCart: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(value(canvasElement, 'flag-isMixed')).toHaveTextContent('false');
    await userEvent.click(canvas.getByRole('button', { name: 'Add Waxed canvas tote' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Add The small garden guide (PDF)' }));
    await expect(value(canvasElement, 'flag-isMixed')).toHaveTextContent('true');
    await userEvent.click(canvas.getByRole('button', { name: 'Add Seasonal seed box' }));
    await expect(value(canvasElement, 'flag-hasSubscription')).toHaveTextContent('true');
    await userEvent.click(canvas.getByRole('button', { name: 'Increase Waxed canvas tote' }));
    await expect(canvas.getByText(/Waxed canvas tote × 2/)).toBeVisible();
  },
};

/** Digital-only carts skip the shipping step. */
export const DigitalOnly: Story = {
  parameters: { demoCommerce: { cart: 'digitalOnly' } },
  play: async ({ canvasElement }) => {
    await expect(value(canvasElement, 'flag-needsShippingStep')).toHaveTextContent('false');
    await expect(value(canvasElement, 'shipping')).toHaveTextContent('$0.00');
  },
};

/** The trial line ($6.00 app) contributes nothing today: 6,500 + 297 + 595 shipping = 7,392 + 8% = $79.83. */
export const TrialLine: Story = {
  parameters: { demoCommerce: { cart: 'subscriptionTrial' } },
  play: async ({ canvasElement }) => {
    await expect(value(canvasElement, 'subtotal')).toHaveTextContent('$73.97');
    await expect(value(canvasElement, 'dueToday')).toHaveTextContent('$79.83');
    await expect(value(canvasElement, 'recurring-2026-04-04')).toHaveTextContent('$6.00 / month from Apr 4, 2026');
  },
};

/** WELCOME10 takes 10% off the $74.00 subtotal; SHIPFREE then removes the $5.95 shipping. */
export const Promos: Story = {
  parameters: { demoCommerce: { cart: 'physicalOnly' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(value(canvasElement, 'total')).toHaveTextContent('$86.35');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply WELCOME10' }));
    await expect(value(canvasElement, 'discount')).toHaveTextContent('-$7.40');
    await expect(value(canvasElement, 'total')).toHaveTextContent('$78.35');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply SHIPFREE' }));
    await expect(value(canvasElement, 'shipping')).toHaveTextContent('$0.00');
    await expect(value(canvasElement, 'total')).toHaveTextContent('$71.93');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply WELCOME10' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('WELCOME10 is already applied.');
    await expect(value(canvasElement, 'total')).toHaveTextContent('$71.93');
  },
};
