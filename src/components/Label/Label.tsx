import type { ComponentPropsWithRef } from 'react';
import styles from './Label.module.css';

/** Props for Label. Accepts all native `<label>` props, including `htmlFor` and `ref`. */
export interface LabelProps extends ComponentPropsWithRef<'label'> {
  /**
   * Shows a visual "*" marker. The marker is hidden from screen readers because the control itself
   * carries the native `required` attribute (Field sets it), which they announce as "required".
   */
  required?: boolean;
  /** Shows "(optional)" as text, for forms that mark optional fields instead of required ones. */
  optional?: boolean;
}

/**
 * A form `<label>` with optional required ("*") or "(optional)" markers. Field renders one for you;
 * use Label directly only for custom control layouts. `required` wins if both markers are set.
 */
export function Label({ required, optional, className, children, ...rest }: LabelProps) {
  return (
    <label className={[styles.label, className].filter(Boolean).join(' ')} {...rest}>
      {children}
      {required && (
        <span className={styles.required} aria-hidden="true">
          {' *'}
        </span>
      )}
      {optional && !required && <span className={styles.optional}> (optional)</span>}
    </label>
  );
}
