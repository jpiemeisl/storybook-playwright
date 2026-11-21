import { useId, type ReactNode } from 'react';
import { formatMoney } from '../../../utils/formatMoney';
import type { Money } from '../../../content-types/money';
import type { CartTotals } from '../../logic/cart';
import { summaryRows, thenBilled, type SummaryRow } from '../../logic/cartSummary';
import styles from './CartSummary.module.css';

type HeadingLevel = 2 | 3;

const Deduction = ({ amount }: { amount: Money }) => (
  <>
    <span aria-hidden="true">−</span>
    <span className={styles.visuallyHidden}>minus </span>
    {formatMoney(amount)}
  </>
);

function rowValue(row: SummaryRow): ReactNode {
  if (row.key === 'discount' || row.key === 'trial') return <Deduction amount={row.amount} />;
  if (row.key === 'shipping' && row.text) return row.text;
  return row.amount ? formatMoney(row.amount) : null;
}

export interface SummaryRowsProps {
  totals: CartTotals;
  /** False before an address is known: shipping reads "Calculated at checkout". */
  shippingKnown?: boolean;
  /** Shows a remove button on each discount row. */
  onRemovePromo?: (code: string) => void;
}

/**
 * The totals as a description list (rows from summaryRows): subtotal, discounts, shipping (shippable
 * carts only), trial deduction, estimated tax and a visually distinct "Due today". Shared by CartSummary
 * and OrderSummary.
 */
export function SummaryRows({ totals, shippingKnown, onRemovePromo }: SummaryRowsProps) {
  return (
    <dl className={styles.rows}>
      {summaryRows(totals, { shippingKnown }).map((row) => (
        <div key={row.key === 'discount' ? `discount-${row.code}` : row.key} className={[styles.row, row.key === 'dueToday' && styles.due].filter(Boolean).join(' ')} data-row={row.key}>
          <dt>
            {row.label}
            {'note' in row && row.note && <span className={styles.note}>{row.note}</span>}
            {row.key === 'discount' && onRemovePromo && (
              <button type="button" className={styles.remove} onClick={() => onRemovePromo(row.code)} aria-label={`Remove promo code ${row.code}`}>
                Remove
              </button>
            )}
          </dt>
          <dd>{rowValue(row)}</dd>
        </div>
      ))}
    </dl>
  );
}

/** "Then billed": recurring charges grouped by interval with start dates and trial notes. Nothing for none. */
export function ThenBilled({ totals, headingLevel = 3 }: { totals: Pick<CartTotals, 'recurring'>; headingLevel?: 3 | 4 }) {
  const items = thenBilled(totals);
  const id = useId();
  if (items.length === 0) return null;
  const H = `h${headingLevel}` as const;
  return (
    <div className={styles.thenBilled}>
      <H id={id} className={styles.subheading}>
        Then billed
      </H>
      <ul aria-labelledby={id}>
        {items.map((item) => (
          <li key={item.text}>
            {item.text}
            {item.note && <span className={styles.note}>{item.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface CartSummaryProps extends SummaryRowsProps {
  /** Messages above the rows, e.g. FreeShippingProgress or a promo banner. */
  messages?: ReactNode;
  /** The PromoCodeInput. */
  promo?: ReactNode;
  /** The checkout action (button or link, plus any reason it is disabled). */
  action?: ReactNode;
  /** Default "Order summary". */
  title?: string;
  /** Default 2. */
  headingLevel?: HeadingLevel;
}

/**
 * Cart totals panel: heading, optional messages, the summary rows, promo code slot, "Then billed" and
 * the checkout action slot. Presentational: every amount comes from `totals`.
 */
export function CartSummary({ totals, shippingKnown, onRemovePromo, messages, promo, action, title = 'Order summary', headingLevel = 2 }: CartSummaryProps) {
  const id = useId();
  const H = `h${headingLevel}` as const;
  return (
    <section className={styles.root} aria-labelledby={id}>
      <H id={id} className={styles.heading}>
        {title}
      </H>
      {messages}
      <SummaryRows totals={totals} shippingKnown={shippingKnown} onRemovePromo={onRemovePromo} />
      {promo}
      <ThenBilled totals={totals} headingLevel={headingLevel === 2 ? 3 : 4} />
      {action && <div className={styles.action}>{action}</div>}
    </section>
  );
}
