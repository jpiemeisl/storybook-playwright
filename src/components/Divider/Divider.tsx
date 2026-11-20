import type { HTMLAttributes } from 'react';
import styles from './Divider.module.css';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  orientation?: DividerOrientation;
  /** Short text shown in the middle of the line, e.g. "or". Also used as the accessible name. */
  label?: string;
}

export function Divider({ orientation = 'horizontal', label, className, ...rest }: DividerProps) {
  const classes = [styles.divider, styles[orientation], label && styles.labelled, className]
    .filter(Boolean)
    .join(' ');

  if (orientation === 'horizontal' && !label) {
    return <hr className={classes} {...rest} />;
  }

  return (
    <div role="separator" aria-orientation={orientation} aria-label={label} className={classes} {...rest}>
      {label && (
        <span className={styles.label} aria-hidden="true">
          {label}
        </span>
      )}
    </div>
  );
}
