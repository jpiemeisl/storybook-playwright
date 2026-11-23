import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { Alert } from '../../../components/Alert';
import { Button, ButtonLink } from '../../../components/Button';
import { Container } from '../../../components/Container';
import { EmptyState } from '../../../components/EmptyState';
import { Heading } from '../../../components/Heading';
import { Icon } from '../../../components/Icon';
import { Link } from '../../../components/Link';
import type { PageContent } from '../../../content-types/blocks';
import { isObj } from '../../../registry/checker';
import { PageSection } from '../../../registry/BlockRenderer';
import { SiteLayout } from '../../../templates/SiteLayout';
import { layoutProps } from '../../../templates/TemplateBlocks';
import type { TemplateProps } from '../../../templates/types';
import { CheckoutStepper, type CheckoutStepperStep } from '../../components/CheckoutStepper';
import { StickyBuyBar, useOutOfView } from '../../components/StickyBuyBar';
import { formatMoney } from '../../../utils/formatMoney';
import { OrderSummary } from '../../components/OrderSummary';
import { TrustBadges } from '../../components/TrustBadges';
import { hasBlockingIssues } from '../../logic/cartLines';
import { canEnterStep, checkoutStepLabels, getCheckoutSteps, validateCheckoutStep, type CheckoutOptions } from '../../logic/checkout';
import type { CheckoutErrors, CheckoutStepId, CheckoutValues } from '../../types/checkout';
import { defaultLineHref, type CommerceContext } from '../../types/context';
import type { CheckoutPage } from '../../types/pages';
import { InformationStep, PaymentStep, ReviewStep, ShippingStep, type StepProps } from './CheckoutSteps';
import styles from './CheckoutTemplate.module.css';

export const canRenderCheckout = (page: PageContent) => {
  const { cart, totals, values, step } = page as Partial<CheckoutPage>;
  return isObj(cart) && isObj(totals) && isObj(values) && typeof step === 'string';
};

const titles: Record<CheckoutStepId, string> = { information: 'Your information', shipping: 'Shipping method', payment: 'Payment', review: 'Review your order' };
const bodies: Record<CheckoutStepId, (props: StepProps) => ReactNode> = { information: InformationStep, shipping: ShippingStep, payment: PaymentStep, review: ReviewStep };

/** Moves focus to the field an error belongs to: ids for text fields and checkboxes, names for radio groups. */
function focusField(key: string) {
  const [prefix, field] = key.split('.');
  const id = field ? `${prefix === 'shippingAddress' ? 'shipping' : 'billing'}-${field}` : ({ email: 'checkout-email', termsAccepted: 'checkout-terms', subscriptionTermsAccepted: 'checkout-subscription-terms' } as Record<string, string>)[key];
  const target = (id && document.getElementById(id)) || document.querySelector<HTMLElement>(`[name="${key}"]`);
  target?.focus();
}

function ErrorSummary({ errors, summaryRef }: { errors: CheckoutErrors; summaryRef: React.Ref<HTMLDivElement> }) {
  return (
    <Alert ref={summaryRef} tabIndex={-1} tone="danger" urgent title="There is a problem">
      <ul className={styles.summaryList}>
        {Object.entries(errors).map(([key, message]) => (
          <li key={key}>
            <Link
              href={`#${key}`}
              onClick={(event) => {
                event.preventDefault();
                focusField(key);
              }}
            >
              {message}
            </Link>
          </li>
        ))}
      </ul>
    </Alert>
  );
}

/** Empty cart or blocking issues: explain and link back to the cart. */
function Guard({ title, message, cartHref }: { title: string; message: string; cartHref: string }) {
  return (
    <div className={styles.guard}>
      <Heading as="h1" size="2xl">
        Checkout
      </Heading>
      <EmptyState title={title} message={message} action={{ label: 'Back to cart', href: cartHref }} />
    </div>
  );
}

/**
 * Multi-step checkout on the minimal site layout: "Back to cart", CheckoutStepper, the step title (the
 * only h1, focused on each step change), then the order summary (collapsed above the form on narrow
 * screens, beside it on wide ones; left out on Review, which shows the items itself) and the step form.
 * Continue validates the step with validateCheckoutStep: on failure an error summary takes focus and
 * links to each field; on success ctx.onStepChange moves on. Review places the order via ctx.onPlaceOrder.
 * `ctx.collectBillingAddress: false` leaves out the billing address fields and their validation, for
 * payment providers that collect billing details themselves.
 */
export function CheckoutTemplate({ page, chrome, ctx }: TemplateProps<CheckoutPage> & { ctx?: CommerceContext }) {
  const { cart, totals, values, issues = [], status = 'idle', errorMessage, links = {} } = page;
  const flags = totals.flags;
  const steps = getCheckoutSteps(flags);
  const step = steps.includes(page.step) ? page.step : steps[0]!;
  const index = steps.indexOf(step);
  const cartHref = links.cart ?? '/cart';
  const [attempts, setAttempts] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const shownStep = useRef(step);
  const formId = useId();
  const actionsRef = useRef<HTMLDivElement>(null);
  const options: CheckoutOptions = { collectBillingAddress: ctx?.collectBillingAddress ?? true };

  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    setAttempts(0);
    headingRef.current?.focus();
  }, [step]);
  useEffect(() => {
    if (attempts > 0) summaryRef.current?.focus();
  }, [attempts]);

  const own = validateCheckoutStep(step, values, flags, options);
  const errors = attempts > 0 ? own : (page.errors ?? {});
  const set = (patch: Partial<CheckoutValues>) => ctx?.onCheckoutChange?.({ ...values, ...patch });
  const go = (target: CheckoutStepId) => (event: MouseEvent) => {
    if (!ctx?.onStepChange) return;
    event.preventDefault();
    ctx.onStepChange(target);
  };
  const stepLink = (target: CheckoutStepId, label: ReactNode, name?: string) => (
    <Link href={`?step=${target}`} onClick={go(target)} aria-label={name}>
      {label}
    </Link>
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (status === 'submitting') return;
    if (Object.keys(own).length > 0) return setAttempts((n) => n + 1);
    if (step === 'review') ctx?.onPlaceOrder?.();
    else ctx?.onStepChange?.(steps[index + 1]!);
  };

  const stepperSteps: CheckoutStepperStep[] = steps.map((id, i) => ({
    id,
    label: checkoutStepLabels[id],
    state: i === index ? 'current' : i < index && Object.keys(validateCheckoutStep(id, values, flags, options)).length === 0 ? 'complete' : 'upcoming',
    href: `?step=${id}`,
  }));
  const next = steps[index + 1];
  const Body = bodies[step];
  const blocked = cart.lines.length === 0 || hasBlockingIssues(issues);
  const actionsOutOfView = useOutOfView(actionsRef, !blocked);
  const submitLabel =
    step === 'review' ? (
      <>
        <Icon name="lock" size="sm" />
        Place order
      </>
    ) : (
      `Continue to ${checkoutStepLabels[next!].toLowerCase()}`
    );

  let content: ReactNode;
  if (cart.lines.length === 0) content = <Guard title="Your cart is empty" message="Add something to your cart before checking out." cartHref={cartHref} />;
  else if (hasBlockingIssues(issues)) content = <Guard title="Some items need your attention" message="One or more items are out of stock or above the available quantity. Update your cart, then check out again." cartHref={cartHref} />;
  else
    content = (
      <>
        <CheckoutStepper steps={stepperSteps} onSelect={ctx?.onStepChange ? (id) => canEnterStep(id as CheckoutStepId, values, flags, options) && ctx.onStepChange!(id as CheckoutStepId) : undefined} />
        <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
          {titles[step]}
        </h1>
        <div className={[styles.layout, step === 'review' && styles.single].filter(Boolean).join(' ')}>
          {step !== 'review' && (
            <div className={styles.aside}>
              <OrderSummary cart={cart} totals={totals} lineHref={ctx?.lineHref ?? defaultLineHref} shippingKnown={!flags.needsShippingStep || index > 1} notes={page.notes} />
            </div>
          )}
          <form id={formId} className={styles.form} noValidate onSubmit={submit}>
            {attempts > 0 && Object.keys(errors).length > 0 && <ErrorSummary errors={errors} summaryRef={summaryRef} />}
            <Body page={{ ...page, step }} ctx={ctx} errors={errors} set={set} stepLink={stepLink} collectBilling={options.collectBillingAddress!} />
            {step === 'review' && status === 'error' && (
              <Alert tone="danger" urgent title="Your order was not placed">
                {errorMessage ?? 'Something went wrong. You have not been charged. Please try again.'}
              </Alert>
            )}
            <div ref={actionsRef} className={styles.actions}>
              <Button type="submit" size="lg" loading={status === 'submitting'}>
                {submitLabel}
              </Button>
              <TrustBadges flags={flags} />
            </div>
          </form>
        </div>
        {/* Narrow screens, while the real button is scrolled away: the total and the same submit, for the same form. */}
        <StickyBuyBar
          shown={actionsOutOfView}
          summary={
            <>
              <span>Due today</span>
              <strong>{formatMoney(totals.dueToday)}</strong>
            </>
          }
        >
          <Button type="submit" form={formId} size="lg" loading={status === 'submitting'} className={styles.barButton}>
            {submitLabel}
          </Button>
        </StickyBuyBar>
      </>
    );

  return (
    <SiteLayout chrome={chrome} variant="minimal" {...layoutProps(ctx)}>
      <PageSection>
        <Container size="lg">
          <div className={styles.root}>
            <ButtonLink href={cartHref} variant="ghost" size="sm" className={styles.back}>
              <Icon name="arrow-left" size="sm" />
              Back to cart
            </ButtonLink>
            {content}
          </div>
        </Container>
      </PageSection>
    </SiteLayout>
  );
}
