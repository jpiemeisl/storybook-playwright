/*
 * Order detail sections: the items (compact cart lines with notes and per-line downloads), the totals
 * (the shared SummaryRows ending in "Billed today", plus recurring charges) and the actions row.
 */
import { Button, ButtonLink } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import { Link } from '../../../components/Link';
import { orderSummaryRows } from '../../logic/account';
import { getCartLineNotes, type CartLineNote } from '../../logic/cartLines';
import { orderLineAmounts } from '../../logic/checkout';
import type { CartLine } from '../../types/cart';
import type { Order } from '../../types/order';
import type { Product } from '../../types/product';
import { CartLineItem } from '../CartLineItem';
import { SummaryRows } from '../CartSummary';
import { DownloadList } from '../DownloadList';
import styles from './OrderDetail.module.css';

export interface OrderItemsListProps {
  order: Order;
  lineHref: (line: CartLine) => string;
  /** Catalogue products, to attach each digital line's files to it. Without them, downloads are not shown per line. */
  products?: readonly Product[];
}

/** Notes for a placed order's line: its recurring note (first billing, trial) instead of the cart's renewal text. */
function orderLineNotes(order: Order, line: CartLine): CartLineNote[] {
  const recurring = order.recurring?.find((r) => r.lineId === line.id);
  const base = getCartLineNotes(line).filter((n) => n.kind === 'savings');
  return recurring ? [{ kind: recurring.trialEndsAt ? 'trial' : 'renewal', text: recurring.note }, ...base] : base;
}

/** The order's items as compact lines; digital lines list their files underneath when `products` is given. */
export function OrderItemsList({ order, lineHref, products = [] }: OrderItemsListProps) {
  const amounts = orderLineAmounts(order);
  return (
    <ul className={styles.items}>
      {order.lines.map((line, i) => {
        const fileIds = new Set(products.find((p) => p.id === line.productId)?.digital?.files.map((f) => f.id) ?? []);
        const files = (order.downloads ?? []).filter((d) => fileIds.has(d.fileId));
        return (
          <li key={line.id}>
            <CartLineItem line={line} amounts={amounts[i]!} href={lineHref(line)} notes={orderLineNotes(order, line)} variant="compact" />
            {files.length > 0 && (
              <div className={styles.lineFiles}>
                <DownloadList downloads={files} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Totals for a placed order: the shared rows ending in "Billed today", then recurring charges. */
export function OrderTotalsSummary({ order, headingLevel = 3 }: { order: Order; headingLevel?: 3 | 4 }) {
  const H = `h${headingLevel}` as const;
  return (
    <div className={styles.totals}>
      <SummaryRows rows={orderSummaryRows(order)} />
      {order.recurring?.length ? (
        <div className={styles.recurring}>
          <H className={styles.subheading}>Then billed</H>
          <ul>
            {order.recurring.map((r) => (
              <li key={r.lineId}>
                {order.lines.find((l) => l.id === r.lineId)?.snapshot.title}: {r.note}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export interface OrderActionsProps {
  order: Pick<Order, 'number'>;
  /** Shows "Buy again". A callback only: the host adds the lines to its cart. */
  onReorder?: () => void;
  /** "Contact support" link. Default "/contact?order=<number>". */
  supportHref?: string;
  /** Shows "Download invoice" when the order has an invoice PDF. */
  invoiceHref?: string;
}

/** Buy again (callback), Contact support and Download invoice (when there is one). */
export function OrderActions({ order, onReorder, supportHref = `/contact?order=${order.number}`, invoiceHref }: OrderActionsProps) {
  return (
    <div className={styles.actions}>
      {onReorder && (
        <Button variant="secondary" onClick={onReorder}>
          <Icon name="refresh" size="sm" />
          Buy again
        </Button>
      )}
      {invoiceHref && (
        <ButtonLink href={invoiceHref} variant="secondary">
          <Icon name="receipt" size="sm" />
          Download invoice
        </ButtonLink>
      )}
      <Link href={supportHref}>Contact support about order {order.number}</Link>
    </div>
  );
}
