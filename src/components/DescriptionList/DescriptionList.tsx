import type { ReactNode } from 'react';
import styles from './DescriptionList.module.css';

export interface DescriptionItem {
  term: string;
  details: ReactNode;
}

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
        {items.map((item) => (
          <div key={item.term} className={styles.item}>
            <dt className={styles.term}>{item.term}</dt>
            <dd className={styles.details}>{item.details}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
