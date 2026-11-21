import { useId, type ReactNode } from 'react';
import type { TableColumn } from '../../component-types/content';
import styles from './Table.module.css';

export interface TableProps<Row extends Record<string, ReactNode>> {
  /** Required: names the table and its scroll region. */
  caption: ReactNode;
  /** Visually hide the caption (it still names the table). */
  hideCaption?: boolean;
  columns?: TableColumn<Row>[];
  rows?: Row[];
  /** Alternative to columns/rows: your own <thead>/<tbody>. */
  children?: ReactNode;
  /** Header stays visible while the table scrolls vertically inside a capped-height region. */
  stickyHeader?: boolean;
  striped?: boolean;
  dense?: boolean;
}

/**
 * Data table in a keyboard-scrollable region (tabindex="0", role="region", labelled by the caption).
 * Wide tables scroll horizontally with CSS-only edge shadows. Numeric columns are end-aligned with
 * tabular numerals.
 */
export function Table<Row extends Record<string, ReactNode>>({
  caption,
  hideCaption = false,
  columns = [],
  rows = [],
  children,
  stickyHeader = false,
  striped = false,
  dense = false,
}: TableProps<Row>) {
  const captionId = useId();
  const alignClass = (column: TableColumn<Row>) =>
    styles[column.numeric ? 'numeric' : `align-${column.align ?? 'start'}`];

  return (
    <div
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
      className={[styles.scroller, stickyHeader && styles.sticky].filter(Boolean).join(' ')}
    >
      <table className={[styles.table, striped && styles.striped, dense && styles.dense].filter(Boolean).join(' ')}>
        <caption id={captionId} className={hideCaption ? styles.visuallyHidden : styles.caption}>
          {caption}
        </caption>
        {children ?? (
          <>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} scope="col" className={alignClass(column)}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  {columns.map((column, columnIndex) => {
                    const Cell = columnIndex === 0 ? 'th' : 'td';
                    return (
                      <Cell key={column.key} scope={columnIndex === 0 ? 'row' : undefined} className={alignClass(column)}>
                        {row[column.key] ?? <span className={styles.empty}>–</span>}
                      </Cell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </>
        )}
      </table>
    </div>
  );
}
