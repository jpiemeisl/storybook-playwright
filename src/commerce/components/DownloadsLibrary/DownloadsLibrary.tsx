import { useId } from 'react';
import { EmptyState } from '../../../components/EmptyState';
import { Field } from '../../../components/Field';
import { Input } from '../../../components/Input';
import { Link } from '../../../components/Link';
import { formatCommerceDate } from '../../logic/pricing';
import type { LibraryItem } from '../../types/account';
import { DownloadList, type DownloadItem } from '../DownloadList';
import { LicenseKey } from '../LicenseKey';
import styles from './DownloadsLibrary.module.css';

/** Props for DownloadsLibrary, the searchable list of every file the customer has bought. */
export interface DownloadsLibraryProps {
  items: LibraryItem[];
  /** Group by product (default) or by order. */
  groupBy?: 'product' | 'order';
  /** Controlled search text: filters by product name. */
  query?: string;
  onQueryChange?: (query: string) => void;
  /** Download URL per file. Default "#" placeholders that do not navigate. */
  hrefFor?: (item: LibraryItem, file: DownloadItem) => string;
  /** Order detail URL. Default "/account/orders/<number>". */
  orderHref?: (orderNumber: string) => string;
  /** Default 2 (group headings); items inside order groups are one level lower. */
  headingLevel?: 2 | 3;
}

/** Items whose product title contains the query (case-insensitive). */
export const filterLibrary = (items: readonly LibraryItem[], query = '') => {
  const q = query.trim().toLowerCase();
  return q ? items.filter((i) => i.productTitle.toLowerCase().includes(q)) : [...items];
};

/**
 * The downloads library: a search box (client-side, controlled), then each product with its order,
 * license summary, masked license key and files (the shared DownloadList; unavailable files show their
 * reason from data). Grouped by product, or by order with the products underneath.
 */
export function DownloadsLibrary({ items, groupBy = 'product', query = '', onQueryChange, hrefFor, orderHref = (n) => `/account/orders/${n}`, headingLevel = 2 }: DownloadsLibraryProps) {
  const searchId = useId();
  if (items.length === 0) return <EmptyState title="No downloads yet" message="Digital products you buy appear here, ready to download." action={{ label: 'Browse digital products', href: '/shop?kind=digital' }} headingLevel={headingLevel} />;

  const shown = filterLibrary(items, query);
  const H = `h${headingLevel}` as const;
  const Inner = `h${headingLevel + 1}` as 'h3' | 'h4';
  const product = (item: LibraryItem, Heading: 'h2' | 'h3' | 'h4') => (
    <article key={`${item.productId}-${item.orderId}`} className={styles.item}>
      <Heading className={styles.title}>{item.productTitle}</Heading>
      <p className={styles.meta}>
        Bought {formatCommerceDate(item.purchasedAt)} in <Link href={orderHref(item.orderNumber)}>order {item.orderNumber}</Link>
      </p>
      {item.licence && <p className={styles.licence}>License: {item.licence.summary}</p>}
      {item.licenseKey && <LicenseKey value={item.licenseKey} />}
      <DownloadList downloads={item.files} hrefFor={hrefFor ? (file) => hrefFor(item, file) : undefined} />
    </article>
  );

  const orders = [...new Set(shown.map((i) => i.orderNumber))];
  return (
    <div className={styles.root}>
      {onQueryChange && (
        <div className={styles.search}>
          <Field id={searchId} label="Search your downloads">
            <Input type="search" value={query} onChange={(e) => onQueryChange(e.target.value)} />
          </Field>
          <p className={styles.count} role="status">
            {shown.length === items.length ? `${items.length} products` : `${shown.length} of ${items.length} products`}
          </p>
        </div>
      )}
      {shown.length === 0 ? (
        <EmptyState title="No downloads match" message={`Nothing matches “${query.trim()}”. Try another name.`} headingLevel={headingLevel} />
      ) : groupBy === 'product' ? (
        shown.map((item) => product(item, H))
      ) : (
        orders.map((number) => {
          const group = shown.filter((i) => i.orderNumber === number);
          return (
            <div key={number} className={styles.group}>
              <H id={`${searchId}-${number}`} className={styles.groupTitle}>
                Order {number}
              </H>
              {group.map((item) => product(item, Inner))}
            </div>
          );
        })
      )}
    </div>
  );
}
