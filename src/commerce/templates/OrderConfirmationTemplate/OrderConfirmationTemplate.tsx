import type { ReactNode } from 'react';
import { Alert } from '../../../components/Alert';
import { ButtonLink } from '../../../components/Button';
import { Container } from '../../../components/Container';
import { Heading } from '../../../components/Heading';
import { Link } from '../../../components/Link';
import { Steps } from '../../../components/Timeline';
import type { StepItem } from '../../../component-types/content';
import type { Money } from '../../../content-types/money';
import type { PageContent } from '../../../content-types/blocks';
import { isObj } from '../../../registry/checker';
import { PageSection } from '../../../registry/BlockRenderer';
import { SiteLayout } from '../../../templates/SiteLayout';
import { layoutProps } from '../../../templates/TemplateBlocks';
import type { TemplateProps } from '../../../templates/types';
import { formatMoney } from '../../../utils/formatMoney';
import { CartLineItem } from '../../components/CartLineItem';
import { DownloadList } from '../../components/DownloadList';
import { orderLineAmounts } from '../../logic/checkout';
import { formatCommerceDate } from '../../logic/pricing';
import { defaultLineHref, type CommerceContext } from '../../types/context';
import type { Order } from '../../types/order';
import type { OrderConfirmationPage } from '../../types/pages';
import { AddressBlock } from '../../components/AddressBlock';
import styles from './OrderConfirmationTemplate.module.css';

export const canRenderConfirmation = (page: PageContent) => isObj((page as Partial<OrderConfirmationPage>).order);

/** "What happens next", by what the order contains. Mixed orders combine the steps. */
export function nextSteps(order: Order): StepItem[] {
  const ships = order.lines.some((l) => l.snapshot.requiresShipping);
  const steps: StepItem[] = [{ title: 'Order placed', description: `Order ${order.number}, ${formatCommerceDate(order.placedAt)}.` }];
  if (order.downloads?.length) steps.push({ title: 'Download your files', description: 'Your downloads are ready now. They are listed below.' });
  if (ships) {
    const method = order.shippingMethod;
    steps.push({ title: 'We pack and ship your order', description: method ? `${method.label}${method.estimate ? `: ${method.estimate}` : ''}.` : 'We’ll pack your order next.' });
    steps.push({ title: 'Tracking follows', description: 'We’ll send tracking details when your parcel leaves us.' });
  }
  if (order.recurring?.length) {
    const titleOf = (lineId: string) => order.lines.find((l) => l.id === lineId)?.snapshot.title ?? '';
    steps.push({
      title: 'Your subscription starts',
      description: (
        <ul className={styles.plain}>
          {order.recurring.map((r) => (
            <li key={r.lineId}>
              {titleOf(r.lineId)}: {r.note}.
            </li>
          ))}
          <li>Manage or cancel anytime from your account.</li>
        </ul>
      ),
    });
  }
  return steps;
}

function Row({ term, amount, deduct, strong, freeText }: { term: string; amount: Money; deduct?: boolean; strong?: boolean; freeText?: string }) {
  return (
    <div className={[styles.row, strong && styles.strong].filter(Boolean).join(' ')}>
      <dt>{term}</dt>
      <dd>
        {deduct && <span aria-hidden="true">−</span>}
        {deduct && <span className={styles.visuallyHidden}>minus </span>}
        {freeText && amount.amount === 0 ? freeText : formatMoney(amount)}
      </dd>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className={styles.section} aria-labelledby={id}>
      <Heading as="h2" size="lg" id={id}>
        {title}
      </Heading>
      {children}
    </section>
  );
}

/**
 * Order confirmation: "Thank you" h1 with the order number, a status alert, "What happens next" (core
 * Steps) varying by kind, downloads, order details (lines, totals with "Billed today" and recurring),
 * addresses when relevant, and actions. Nothing is sent: the email line is demo wording, shown only
 * when the order has an email.
 */
export function OrderConfirmationTemplate({ page, chrome, ctx }: TemplateProps<OrderConfirmationPage> & { ctx?: CommerceContext }) {
  const { order, links = {} } = page;
  const { totals } = order;
  const amounts = orderLineAmounts(order);
  const lineHref = ctx?.lineHref ?? defaultLineHref;
  const ships = order.lines.some((l) => l.snapshot.requiresShipping);
  const billedToday = totals.dueToday ?? totals.total;

  return (
    <SiteLayout chrome={chrome} {...layoutProps(ctx)}>
      <PageSection>
        <Container size="md">
          <div className={styles.root}>
            <header className={styles.head}>
              <Heading as="h1" size="3xl">
                Thank you for your order
              </Heading>
              <p className={styles.number}>
                Order number <strong>{order.number}</strong>
              </p>
            </header>
            <Alert tone="success" title="Order confirmed">
              We’ve received order {order.number}.{order.email && ` Demo only: a confirmation would be emailed to ${order.email}.`}
            </Alert>

            <Section id="next-steps" title="What happens next">
              <Steps items={nextSteps(order)} currentStep={2} headingLevel={3} />
            </Section>

            {order.downloads?.length ? (
              <Section id="downloads" title="Your downloads">
                <DownloadList downloads={order.downloads} />
              </Section>
            ) : null}

            <Section id="order-details" title="Order details">
              <ul className={styles.lines}>
                {order.lines.map((line, i) => (
                  <li key={line.id}>
                    <CartLineItem line={line} amounts={amounts[i]!} href={lineHref(line)} variant="compact" notes={[]} />
                  </li>
                ))}
              </ul>
              <dl className={styles.totals}>
                <Row term="Subtotal" amount={totals.subtotal} />
                {totals.discount.amount > 0 && <Row term="Discount" amount={totals.discount} deduct />}
                {ships && <Row term="Shipping" amount={totals.shipping} freeText="Free" />}
                <Row term="Tax" amount={totals.tax} />
                {totals.dueToday && <Row term="Order total" amount={totals.total} />}
                <Row term="Billed today" amount={billedToday} strong />
              </dl>
              {order.recurring?.length ? (
                <div className={styles.recurring}>
                  <Heading as="h3" size="md">
                    Then billed
                  </Heading>
                  <ul>
                    {order.recurring.map((r) => (
                      <li key={r.lineId}>
                        {order.lines.find((l) => l.id === r.lineId)?.snapshot.title}: {r.note}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Section>

            {(order.shippingAddress || order.billingAddress) && (
              <Section id="addresses" title="Addresses">
                <div className={styles.addresses}>
                  {order.shippingAddress && (
                    <div>
                      <Heading as="h3" size="md">
                        Shipping address
                      </Heading>
                      <AddressBlock address={order.shippingAddress} />
                    </div>
                  )}
                  {order.billingAddress && (
                    <div>
                      <Heading as="h3" size="md">
                        Billing address
                      </Heading>
                      <AddressBlock address={order.billingAddress} />
                    </div>
                  )}
                </div>
              </Section>
            )}

            <div className={styles.actions}>
              <ButtonLink href={links.shop ?? '/shop'}>Continue shopping</ButtonLink>
              <Link href={links.order ?? `/account/orders/${order.number}`}>View order {order.number}</Link>
            </div>
          </div>
        </Container>
      </PageSection>
    </SiteLayout>
  );
}
