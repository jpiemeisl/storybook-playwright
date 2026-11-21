import { useState } from 'react';
import { Field } from '../../../components/Field';
import { Select } from '../../../components/Select';
import { sortKeys, sortLabels, type SortKey } from '../../logic/browse';
import styles from './SortSelect.module.css';

export interface SortSelectProps {
  value: SortKey;
  /** Live mode. Without it the select is a plain field in a GET form (name "sort"). */
  onChange?: (sort: SortKey) => void;
  /** Which sort keys to offer. Default all. */
  options?: readonly SortKey[];
  /** Associates the select with a form elsewhere on the page. */
  form?: string;
}

/** "Sort by" select named `sort`. After a change in live mode, the new order is announced politely. */
export function SortSelect({ value, onChange, options = sortKeys, form }: SortSelectProps) {
  const [announcement, setAnnouncement] = useState('');
  return (
    <div className={styles.root}>
      <Field label="Sort by">
        <Select
          name="sort"
          form={form}
          size="sm"
          options={options.map((key) => ({ value: key, label: sortLabels[key] }))}
          {...(onChange
            ? {
                value,
                onChange: (event) => {
                  const next = event.target.value as SortKey;
                  onChange(next);
                  setAnnouncement(`Sorted by ${sortLabels[next].toLowerCase()}`);
                },
              }
            : { defaultValue: value })}
        />
      </Field>
      <span className={styles.visuallyHidden} role="status">
        {announcement}
      </span>
    </div>
  );
}
