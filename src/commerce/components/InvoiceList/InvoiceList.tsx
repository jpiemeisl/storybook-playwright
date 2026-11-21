import { useId } from 'react';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { Link } from '../../../components/Link';
import { isSafeHref } from '../../../registry/links';
import { formatMoney } from '../../../utils/formatMoney';
import { groupInvoicesByYear, type StatusTone } from '../../logic/account';
import { formatCommerceDate } from '../../logic/pricing';
import type { Invoice } from '../../types/account';
import { StatusBadge } from '../StatusBadge';
import styles from './InvoiceList.module.css';

export interface InvoiceListProps {
  invoices: Invoice[];
  /** Shows "Retry payment" on failed invoices (a callback only). */
  onRetry?: (invoice: Invoice) => void;
  /** Year heading level. Default 3. */
  headingLevel?: 2 | 3 | 4;
}

const statusInfo: Record<Invoice['status'], { label: string; tone: StatusTone }> = {
  paid: { label: 'Paid', tone: 'success' },
  open: { label: 'Due', tone: 'info' },
  failed: { label: 'Payment failed', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'neutral' },
};

/**
 * Invoices grouped by year (headings), each year a table on wide containers (number, date, description,
 * amount, status, download) or a stacked list on narrow ones. Failed invoices offer "Retry payment".
 * Download links appear only for safe hrefs.
 */
export function InvoiceList({ invoices, onRetry, headingLevel = 3 }: InvoiceListProps) {
  const listId = useId();
  if (invoices.length === 0) return <EmptyState title="No invoices yet" message="Invoices for your orders and subscriptions appear here." headingLevel={headingLevel === 4 ? 3 : headingLevel} />;
  const H = `h${headingLevel}` as const;
  const download = (inv: Invoice) =>
    inv.href && isSafeHref(inv.href) ? (
      <Link href={inv.href} aria-label={`Download invoice ${inv.number} (PDF)`}>
        Download
      </Link>
    ) : (
      <span className={styles.muted}>Not ready yet</span>
    );
  const retry = (inv: Invoice) =>
    inv.status === 'failed' && onRetry ? (
      <Button size="sm" variant="secondary" onClick={() => onRetry(inv)} aria-label={`Retry payment for invoice ${inv.number}`}>
        Retry payment
      </Button>
    ) : null;

  return (
    <div className={styles.root}>
      {groupInvoicesByYear(invoices).map(({ year, invoices: list }) => (
        <div key={year} className={styles.year}>
          <H id={`${listId}-${year}`} className={styles.heading}>
            {year}
          </H>
          <ul className={styles.cards}>
            {list.map((inv) => (
              <li key={inv.id} className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={styles.number}>{inv.number}</span>
                  <StatusBadge {...statusInfo[inv.status]} />
                </div>
                <p className={styles.description}>{inv.description}</p>
                <p className={styles.muted}>
                  {formatCommerceDate(inv.issuedAt)} · {formatMoney(inv.amount)}
                </p>
                <div className={styles.cardActions}>
                  {download(inv)}
                  {retry(inv)}
                </div>
              </li>
            ))}
          </ul>
          <div className={styles.table}>
            <table>
              <caption className={styles.visuallyHidden}>Invoices from {year}</caption>
              <thead>
                <tr>
                  <th scope="col">Invoice</th>
                  <th scope="col">Date</th>
                  <th scope="col">Description</th>
                  <th scope="col" className={styles.numeric}>
                    Amount
                  </th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className={styles.visuallyHidden}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((inv) => (
                  <tr key={inv.id}>
                    <th scope="row">{inv.number}</th>
                    <td>{formatCommerceDate(inv.issuedAt)}</td>
                    <td className={styles.descriptionCell}>{inv.description}</td>
                    <td className={styles.numeric}>{formatMoney(inv.amount)}</td>
                    <td>
                      <StatusBadge {...statusInfo[inv.status]} />
                    </td>
                    <td>
                      <div className={styles.cardActions}>
                        {download(inv)}
                        {retry(inv)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
