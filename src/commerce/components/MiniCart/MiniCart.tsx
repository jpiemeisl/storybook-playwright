import { useEffect, useId, useRef } from 'react';
import { Alert } from '../../../components/Alert';
import { Button, ButtonLink } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import { formatMoney } from '../../../utils/formatMoney';
import type { CartTotals } from '../../logic/cart';
import { hasBlockingIssues, type CartIssue } from '../../logic/cartLines';
import type { Cart, CartLine } from '../../types/cart';
import { CartLineItem } from '../CartLineItem';
import { EmptyCart } from '../EmptyCart';
import { FreeShippingProgress } from '../FreeShippingProgress';
import styles from './MiniCart.module.css';

export interface MiniCartProps {
  /** Controlled open state. */
  open: boolean;
  onClose: () => void;
  cart: Cart;
  totals: CartTotals;
  /** From getCartIssues. Blocking issues disable Checkout with a visible reason. */
  issues?: CartIssue[];
  lineHref: (line: CartLine) => string;
  /** Quantity stepper for physical lines. */
  onQuantityChange?: (lineId: string, quantity: number) => void;
  onRemove?: (lineId: string) => void;
  /** Cart page, checkout and "Continue shopping" URLs. */
  links: { cart: string; checkout: string; shop?: string };
  /** `loading` shows a busy message instead of lines; `error` an alert above them. */
  status?: 'idle' | 'loading' | 'error';
}

const itemsText = (count: number) => `${count} ${count === 1 ? 'item' : 'items'}`;

/**
 * Cart drawer on the native <dialog> (showModal: focus trap, inert page), like FilterDrawer and
 * MobileMenu. Escape, the close button and the backdrop close it; scroll lock and focus return to the
 * opener run in effects. The line list scrolls inside the drawer; the footer stays put.
 */
export function MiniCart({ open, onClose, cart, totals, issues = [], lineHref, onQuantityChange, onRemove, links, status = 'idle' }: MiniCartProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const reasonId = useId();
  const blocked = hasBlockingIssues(issues);
  const empty = cart.lines.length === 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      root.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      }}
      onClose={(event) => open && !event.currentTarget.open && onClose()}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {open && (
        <div className={styles.panel}>
          <div className={styles.top}>
            <h2 id={titleId} className={styles.title}>
              Your cart <span className={styles.count}>({itemsText(totals.itemCount)})</span>
            </h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close cart">
              <Icon name="close" />
            </button>
          </div>

          <div className={styles.body} aria-busy={status === 'loading' || undefined}>
            {status === 'error' && (
              <Alert tone="danger" title="Your cart could not be updated">
                Check your connection and try again. Nothing in your cart has changed.
              </Alert>
            )}
            {status === 'loading' ? (
              <p className={styles.loading} role="status">
                Loading your cart…
              </p>
            ) : empty ? (
              <EmptyCart shopHref={links.shop} headingLevel={3} />
            ) : (
              <>
                <FreeShippingProgress progress={totals.freeShippingProgress} subtotal={totals.subtotal} hasShippable={totals.flags.hasShippable} />
                <ul className={styles.lines}>
                  {cart.lines.map((line) => (
                    <li key={line.id}>
                      <CartLineItem
                        line={line}
                        amounts={totals.lines.find((l) => l.lineId === line.id)!}
                        href={lineHref(line)}
                        issue={issues.find((i) => i.lineId === line.id)}
                        variant="compact"
                        onQuantityChange={onQuantityChange}
                        onRemove={onRemove}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {!empty && status !== 'loading' && (
            <div className={styles.footer}>
              <dl className={styles.subtotal}>
                <dt>Subtotal</dt>
                <dd>{formatMoney(totals.subtotal)}</dd>
              </dl>
              <p className={styles.note}>{totals.flags.hasShippable ? 'Shipping and tax are calculated at checkout.' : 'Tax is calculated at checkout.'}</p>
              {blocked && (
                <p id={reasonId} className={styles.reason}>
                  <Icon name="alert-triangle" size="sm" />
                  Fix the items marked above to check out.
                </p>
              )}
              <div className={styles.actions}>
                <ButtonLink href={links.cart} variant="secondary">
                  View cart
                </ButtonLink>
                {blocked ? (
                  <Button aria-disabled="true" aria-describedby={reasonId} onClick={(e) => e.preventDefault()}>
                    <Icon name="lock" size="sm" />
                    Checkout
                  </Button>
                ) : (
                  <ButtonLink href={links.checkout}>
                    <Icon name="lock" size="sm" />
                    Checkout
                  </ButtonLink>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
