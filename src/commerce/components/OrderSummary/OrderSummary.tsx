import { useEffect, useId, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { formatMoney } from '../../../utils/formatMoney';
import type { CartTotals } from '../../logic/cart';
import type { CartLineNote } from '../../logic/cartLines';
import type { Cart, CartLine } from '../../types/cart';
import { CartLineItem } from '../CartLineItem';
import { SummaryRows, ThenBilled } from '../CartSummary';
import styles from './OrderSummary.module.css';

export interface OrderSummaryProps {
  cart: Cart;
  totals: CartTotals;
  lineHref: (line: CartLine) => string;
  /** False before an address is known: shipping reads "Calculated at checkout". */
  shippingKnown?: boolean;
  /** Catalogue-aware notes per line id (getCartNotes). */
  notes?: Record<string, CartLineNote[]>;
}

/** Wide layouts (the checkout sidebar) keep the summary open; matches the template's two-column breakpoint. */
const WIDE = '(min-width: 64rem)';

/**
 * Read-only order summary for checkout: compact lines, the shared summary rows (CartSummary's
 * SummaryRows) and "Then billed". A native <details>: closed by default on narrow screens with the
 * "Due today" total in its summary line, and held open on wide screens (a media query listener in an
 * effect; before it runs the summary starts closed, which is also the no-JavaScript state).
 */
export function OrderSummary({ cart, totals, lineHref, shippingKnown, notes }: OrderSummaryProps) {
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const headingId = useId();

  useEffect(() => {
    const query = window.matchMedia(WIDE);
    const update = () => {
      setWide(query.matches);
      if (query.matches) setOpen(true);
    };
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return (
    <details
      className={styles.root}
      open={open}
      data-wide={wide || undefined}
      onToggle={(event) => {
        const next = event.currentTarget.open;
        if (wide && !next) event.currentTarget.open = true;
        else setOpen(next);
      }}
    >
      <summary className={styles.summary} tabIndex={wide ? -1 : undefined}>
        <h2 id={headingId} className={styles.heading}>
          <Icon name="bag" size="sm" />
          Order summary
          <span className={styles.toggleText}>{open ? 'Hide' : 'Show'}</span>
        </h2>
        <span className={styles.due}>
          <span className={styles.visuallyHidden}>Due today: </span>
          {formatMoney(totals.dueToday)}
        </span>
        <Icon name="chevron-down" size="sm" className={styles.chevron} />
      </summary>
      <div className={styles.body}>
        <ul className={styles.lines} aria-labelledby={headingId}>
          {cart.lines.map((line) => (
            <li key={line.id}>
              <CartLineItem line={line} amounts={totals.lines.find((l) => l.lineId === line.id)!} href={lineHref(line)} notes={notes?.[line.id]} variant="compact" />
            </li>
          ))}
        </ul>
        <SummaryRows totals={totals} shippingKnown={shippingKnown} />
        <ThenBilled totals={totals} />
      </div>
    </details>
  );
}
