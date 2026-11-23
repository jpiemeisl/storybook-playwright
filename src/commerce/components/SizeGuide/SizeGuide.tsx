import { useState } from 'react';
import { Icon } from '../../../components/Icon';
import { Modal } from '../../../components/Modal';
import { Table } from '../../../components/Table';
import type { TableData } from '../../types/product';
import styles from './SizeGuide.module.css';

/** Props for SizeGuide. */
export interface SizeGuideProps {
  /** The size chart. Without it the component renders nothing. */
  table?: TableData;
  /** Used in the dialog title: "Size guide: Organic cotton tee". */
  productTitle: string;
}

/** A link-styled button that opens the product's size guide table in a Modal. Renders nothing without a table. */
export function SizeGuide({ table, productTitle }: SizeGuideProps) {
  const [open, setOpen] = useState(false);
  if (!table) return null;
  const rows = table.rows.map((row) => Object.fromEntries(table.columns.map((c) => [c.key, row[c.key] ?? '–'])));
  return (
    <>
      <button type="button" className={styles.trigger} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <Icon name="ruler" size="sm" />
        Size guide
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Size guide: ${productTitle}`} size="lg">
        <Table caption={table.caption} columns={table.columns.map((c) => ({ key: c.key, header: c.header, numeric: c.numeric, align: c.align }))} rows={rows} striped />
      </Modal>
    </>
  );
}
