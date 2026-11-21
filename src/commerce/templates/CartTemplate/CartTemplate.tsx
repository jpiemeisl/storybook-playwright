import { useId } from 'react';
import { Alert } from '../../../components/Alert';
import { Button, ButtonLink } from '../../../components/Button';
import { Container } from '../../../components/Container';
import { Heading } from '../../../components/Heading';
import { Icon } from '../../../components/Icon';
import { Link } from '../../../components/Link';
import { PageHeader } from '../../../components/PageHeader';
import type { PageContent } from '../../../content-types/blocks';
import { isObj } from '../../../registry/checker';
import { PageSection } from '../../../registry/BlockRenderer';
import { SiteLayout } from '../../../templates/SiteLayout';
import { layoutProps } from '../../../templates/TemplateBlocks';
import type { TemplateProps } from '../../../templates/types';
import { CartLineItem } from '../../components/CartLineItem';
import { CartSummary } from '../../components/CartSummary';
import { CrossSell } from '../../components/CrossSell';
import { EmptyCart } from '../../components/EmptyCart';
import { FreeShippingProgress } from '../../components/FreeShippingProgress';
import { PromoCodeInput } from '../../components/PromoCodeInput';
import { TrustBadges } from '../../components/TrustBadges';
import { hasBlockingIssues, type CartIssue } from '../../logic/cartLines';
import { defaultLineHref, defaultProductHref, type CommerceContext } from '../../types/context';
import type { CartPage } from '../../types/pages';
import styles from './CartTemplate.module.css';

export const canRenderCart = (page: PageContent) => {
  const { cart, totals } = page as Partial<CartPage>;
  return isObj(cart) && Array.isArray(cart.lines) && isObj(totals);
};

/** Focuses a line from the issues summary (the line has tabIndex -1). */
const focusLine = (lineId: string) => (event: React.MouseEvent) => {
  const line = document.getElementById(`line-${lineId}`);
  if (!line) return;
  event.preventDefault();
  line.focus();
  line.scrollIntoView({ block: 'center' });
};

/** "Some items need your attention" with a link to each affected line. */
function IssuesAlert({ issues }: { issues: CartIssue[] }) {
  return (
    <Alert tone="warning" title="Some items need your attention before you check out">
      <ul className={styles.issueList}>
        {issues.map((issue) => (
          <li key={issue.lineId}>
            <Link href={`#line-${issue.lineId}`} onClick={focusLine(issue.lineId)}>
              {issue.title}: {issue.message}
            </Link>
          </li>
        ))}
      </ul>
    </Alert>
  );
}

/** Placeholder rows while the cart loads. Decorative; a status message says what is happening. */
function CartSkeleton() {
  return (
    <div className={styles.skeleton} aria-busy="true">
      <p role="status">Loading your cart…</p>
      {[0, 1, 2].map((i) => (
        <div key={i} className={styles.skeletonLine} aria-hidden="true">
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

/**
 * Cart page: "Your cart" (h1), an issues alert linking to each affected line, free-shipping progress,
 * the lines, and a summary column (sticky on wide screens, below the lines on narrow ones) with promo
 * code, checkout action (disabled with a visible reason when blocked), "Continue shopping" and trust
 * badges. Then "Complete your order". Empty, loading and error states. All amounts come from page.totals.
 */
export function CartTemplate({ page, chrome, ctx }: TemplateProps<CartPage> & { ctx?: CommerceContext }) {
  const { cart, totals, issues, notes, crossSell = [], status = 'idle', lineStatus = {}, links = {} } = page;
  const reasonId = useId();
  const shop = links.shop ?? '/shop';
  const checkoutHref = links.checkout ?? '/checkout';
  const lineHref = ctx?.lineHref ?? defaultLineHref;
  const blocked = hasBlockingIssues(issues);
  const empty = cart.lines.length === 0;
  const count = `${totals.itemCount} ${totals.itemCount === 1 ? 'item' : 'items'}`;

  const action = (
    <>
      {blocked && (
        <p id={reasonId} className={styles.reason}>
          <Icon name="alert-triangle" size="sm" />
          Fix the items marked in your cart to check out.
        </p>
      )}
      {blocked || ctx?.onCheckout ? (
        <Button size="lg" aria-disabled={blocked || undefined} aria-describedby={blocked ? reasonId : undefined} onClick={() => !blocked && ctx?.onCheckout?.()}>
          <Icon name="lock" size="sm" />
          Check out
        </Button>
      ) : (
        <ButtonLink href={checkoutHref} size="lg">
          <Icon name="lock" size="sm" />
          Check out
        </ButtonLink>
      )}
      <Link href={shop} className={styles.continue}>
        Continue shopping
      </Link>
      <TrustBadges flags={totals.flags} />
    </>
  );

  return (
    <SiteLayout chrome={chrome} {...layoutProps(ctx)}>
      <PageSection>
        <Container size="xl">
          <div className={styles.root}>
            <PageHeader title="Your cart" description={!empty && status !== 'loading' ? count : undefined} headingLevel={1} />
            {status === 'error' && (
              <Alert tone="danger" urgent title="Your cart could not be loaded">
                Check your connection and refresh the page. Nothing in your cart has been lost.
              </Alert>
            )}
            {status === 'loading' ? (
              <CartSkeleton />
            ) : empty ? (
              <EmptyCart shopHref={shop} />
            ) : (
              <div className={styles.layout}>
                <div className={styles.main}>
                  {issues.length > 0 && <IssuesAlert issues={issues} />}
                  <FreeShippingProgress progress={totals.freeShippingProgress} subtotal={totals.subtotal} hasShippable={totals.flags.hasShippable} />
                  <section aria-labelledby="cart-items">
                    <Heading as="h2" size="lg" id="cart-items">
                      Items in your cart
                    </Heading>
                    <ul className={styles.lines}>
                      {cart.lines.map((line) => (
                        <li key={line.id}>
                          <CartLineItem
                            line={line}
                            amounts={totals.lines.find((l) => l.lineId === line.id)!}
                            href={lineHref(line)}
                            notes={notes?.[line.id]}
                            issue={issues.find((i) => i.lineId === line.id)}
                            status={lineStatus[line.id] ?? 'idle'}
                            onQuantityChange={ctx?.onQuantityChange}
                            onRemove={ctx?.onRemoveLine}
                            onSaveForLater={ctx?.onSaveForLater}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
                <div className={styles.aside}>
                  <CartSummary
                    totals={totals}
                    shippingKnown={false}
                    promo={ctx?.onApplyPromo ? <PromoCodeInput applied={cart.promoCodes} onApply={ctx.onApplyPromo} onRemove={ctx.onRemovePromo} /> : undefined}
                    action={action}
                  />
                </div>
              </div>
            )}
            {!empty && status !== 'loading' && crossSell.length > 0 && <CrossSell products={crossSell} hrefFor={ctx?.productHref ?? defaultProductHref} onQuickAdd={ctx?.onQuickAdd} />}
          </div>
        </Container>
      </PageSection>
    </SiteLayout>
  );
}
