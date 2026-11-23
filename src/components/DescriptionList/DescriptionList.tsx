import type { ReactNode } from 'react';
import styles from './DescriptionList.module.css';

/** One term/details pair in a DescriptionList, rendered as a `<dt>` and `<dd>`. */
export interface DescriptionItem {
  /** The label, e.g. "Industry". Must be unique within the list (used as the key). */
  term: string;
  /** The value, e.g. "Retail". */
  details: ReactNode;
}

/** Props for DescriptionList. Renders nothing when `items` is empty. */
export interface DescriptionListProps {
  items: DescriptionItem[];
  /** `columns`: items side by side when the slot is 36rem+ (a facts strip). `stacked`: one per row. Default "columns". */
  layout?: 'columns' | 'stacked';
}

/** Key facts as a <dl>, e.g. the client, industry and services of a case study. */
export function DescriptionList({ items, layout = 'columns' }: DescriptionListProps) {
  if (items.length === 0) return null;
  return (
    <div className={styles.root}>
      <dl className={[styles.list, styles[layout]].join(' ')}>
        {items.map((item, index) => (
          <div key={`${item.term}-${index}`} className={styles.item}>
            <dt className={styles.term}>{item.term}</dt>
            <dd className={styles.details}>{item.details}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
