/*
 * The four checkout step bodies. Each renders inside the template's <form>; the template owns the
 * heading, validation, error summary and navigation. Sections use h2 under the step's h1.
 */
import type { ReactNode } from 'react';
import { Alert } from '../../../components/Alert';
import { Checkbox } from '../../../components/Checkbox';
import { Field } from '../../../components/Field';
import { Heading } from '../../../components/Heading';
import { Input } from '../../../components/Input';
import { Link } from '../../../components/Link';
import { AddressForm } from '../../components/AddressForm';
import { CartLineItem } from '../../components/CartLineItem';
import { SummaryRows, ThenBilled } from '../../components/CartSummary';
import { PaymentMethodSelector } from '../../components/PaymentMethodSelector';
import { ShippingMethodSelector } from '../../components/ShippingMethodSelector';
import type { CartTotals } from '../../logic/cart';
import { thenBilled } from '../../logic/cartSummary';
import type { CheckoutErrors, CheckoutStepId, CheckoutValues } from '../../types/checkout';
import { defaultLineHref, type CommerceContext } from '../../types/context';
import type { CheckoutPage } from '../../types/pages';
import { AddressBlock } from '../../components/AddressBlock';
import styles from './CheckoutTemplate.module.css';

export interface StepProps {
  page: CheckoutPage;
  ctx?: CommerceContext;
  errors: CheckoutErrors;
  /** Merges a change into the values and reports it. */
  set: (patch: Partial<CheckoutValues>) => void;
  /** A link (with the click handled when the host navigates in place) to another step. */
  stepLink: (step: CheckoutStepId, label: ReactNode, name?: string) => ReactNode;
}

const paymentLabels = { card: 'Credit or debit card', wallet: 'Digital wallet' } as const;

function Section({ id, title, action, children }: { id: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.section} aria-labelledby={id}>
      <div className={styles.sectionHead}>
        <Heading as="h2" size="md" id={id}>
          {title}
        </Heading>
        {action}
      </div>
      {children}
    </section>
  );
}

export function InformationStep({ page, errors, set }: StepProps) {
  const { values, totals } = page;
  return (
    <>
      <Section id="checkout-contact" title="Contact">
        <Field id="checkout-email" label="Email" required error={errors.email} hint="For your receipt and order updates.">
          <Input name="email" type="email" autoComplete="email" inputMode="email" value={values.email} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Checkbox id="checkout-marketing" name="marketingConsent" label="Email me about new products and offers" checked={!!values.marketingConsent} onChange={(e) => set({ marketingConsent: e.target.checked })} />
      </Section>
      {totals.flags.needsShippingStep ? (
        <AddressForm section="shipping" idPrefix="shipping" value={values.shippingAddress ?? {}} errors={errors} onChange={(a) => set({ shippingAddress: a as CheckoutValues['shippingAddress'] })} />
      ) : (
        <>
          <p className={styles.explain}>Nothing in your order is shipped, so we only need your billing address for the payment.</p>
          <AddressForm section="billing" idPrefix="billing" value={values.billingAddress ?? {}} errors={errors} onChange={(a) => set({ billingAddress: a as CheckoutValues['billingAddress'] })} />
        </>
      )}
    </>
  );
}

/** Free shipping applies to whichever method is chosen (computeCartTotals), so every method is marked. */
const freeIds = (page: CheckoutPage) => {
  const free = page.totals.freeShippingProgress.reached || page.totals.appliedPromos.some((p) => p.kind === 'free-shipping');
  return free ? page.shippingMethods.map((m) => m.id) : [];
};

export function ShippingStep({ page, errors, set, stepLink }: StepProps) {
  const address = page.values.shippingAddress;
  return (
    <>
      {address && (
        <Section id="checkout-ship-to" title="Ship to" action={stepLink('information', 'Change', 'Change shipping address')}>
          <AddressBlock address={address} />
        </Section>
      )}
      <ShippingMethodSelector methods={page.shippingMethods} value={page.values.shippingMethodId} onChange={(id) => set({ shippingMethodId: id })} freeMethodIds={freeIds(page)} error={errors.shippingMethodId} />
    </>
  );
}

function renewalText(totals: CartTotals) {
  const charges = thenBilled(totals).map((i) => i.text);
  return charges.length ? `Your subscription renews automatically (${charges.join('; ')}) until you cancel.` : 'Your subscription renews automatically until you cancel.';
}

export function PaymentStep({ page, ctx, errors, set, stepLink }: StepProps) {
  const { values, totals } = page;
  const ships = totals.flags.needsShippingStep;
  return (
    <>
      <PaymentMethodSelector value={values.paymentMethod} onChange={(m) => set({ paymentMethod: m })} paymentFields={ctx?.paymentFields} error={errors.paymentMethod} />
      <Section id="checkout-billing" title="Billing address" action={!ships && values.billingAddress ? stepLink('information', 'Change', 'Change billing address') : undefined}>
        {ships ? (
          <>
            <Checkbox id="checkout-billing-same" name="billingSameAsShipping" label="Same as shipping address" checked={values.billingSameAsShipping} onChange={(e) => set({ billingSameAsShipping: e.target.checked })} />
            {!values.billingSameAsShipping && <AddressForm section="billing" idPrefix="billing" legend="Enter your billing address" value={values.billingAddress ?? {}} errors={errors} onChange={(a) => set({ billingAddress: a as CheckoutValues['billingAddress'] })} />}
          </>
        ) : (
          values.billingAddress && <AddressBlock address={values.billingAddress} />
        )}
      </Section>
      {totals.flags.hasDigital && (
        <Alert tone="info" title="Digital delivery">
          Your downloads are available on the confirmation page as soon as the payment goes through.
        </Alert>
      )}
      <div className={styles.terms}>
        <Checkbox
          id="checkout-terms"
          name="termsAccepted"
          required
          checked={values.termsAccepted}
          onChange={(e) => set({ termsAccepted: e.target.checked })}
          error={errors.termsAccepted}
          label={
            <>
              I agree to the <Link href={page.links?.terms ?? '/terms'}>terms of sale</Link>
            </>
          }
        />
        {totals.flags.hasSubscription && (
          <Checkbox
            id="checkout-subscription-terms"
            name="subscriptionTermsAccepted"
            required
            checked={!!values.subscriptionTermsAccepted}
            onChange={(e) => set({ subscriptionTermsAccepted: e.target.checked })}
            error={errors.subscriptionTermsAccepted}
            label="I understand how my subscription renews and how to cancel"
            description={`${renewalText(totals)} You can cancel anytime from your account before the next charge.`}
          />
        )}
      </div>
    </>
  );
}

export function ReviewStep({ page, ctx, stepLink }: StepProps) {
  const { values, totals, cart, notes, shippingMethods } = page;
  const ships = totals.flags.needsShippingStep;
  const method = shippingMethods.find((m) => m.id === values.shippingMethodId);
  const billing = ships && values.billingSameAsShipping ? values.shippingAddress : values.billingAddress;
  const lineHref = ctx?.lineHref ?? defaultLineHref;
  return (
    <>
      <Section id="review-contact" title="Contact" action={stepLink('information', 'Edit', 'Edit contact')}>
        <p className={styles.value}>{values.email}</p>
      </Section>
      {ships && values.shippingAddress && (
        <Section id="review-ship-to" title="Shipping address" action={stepLink('information', 'Edit', 'Edit shipping address')}>
          <AddressBlock address={values.shippingAddress} />
        </Section>
      )}
      {ships && (
        <Section id="review-method" title="Shipping method" action={stepLink('shipping', 'Edit', 'Edit shipping method')}>
          <p className={styles.value}>{method ? `${method.label}${method.estimate ? ` (${method.estimate})` : ''}` : 'Not chosen'}</p>
        </Section>
      )}
      <Section id="review-payment" title="Payment" action={stepLink('payment', 'Edit', 'Edit payment')}>
        <p className={styles.value}>{values.paymentMethod ? paymentLabels[values.paymentMethod] : 'Not chosen'}</p>
        {billing && (
          <>
            <p className={styles.label}>Billing address</p>
            <AddressBlock address={billing} />
          </>
        )}
      </Section>
      <Section id="review-items" title="Items">
        <ul className={styles.lines}>
          {cart.lines.map((line) => (
            <li key={line.id}>
              <CartLineItem line={line} amounts={totals.lines.find((l) => l.lineId === line.id)!} href={lineHref(line)} notes={notes?.[line.id]} variant="compact" />
            </li>
          ))}
        </ul>
        <SummaryRows totals={totals} />
        <ThenBilled totals={totals} />
      </Section>
    </>
  );
}
