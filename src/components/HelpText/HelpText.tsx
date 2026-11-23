import type { ComponentPropsWithRef } from 'react';
import { Icon } from '../Icon';
import styles from './HelpText.module.css';

/** Props for HelpText: all native `<p>` props, including `id` and `ref`. */
export type HelpTextProps = ComponentPropsWithRef<'p'>;

/** Hint under a control. Give it an id and reference it from the control's aria-describedby (Field does this). */
export function HelpText({ className, ...rest }: HelpTextProps) {
  return <p className={[styles.help, className].filter(Boolean).join(' ')} {...rest} />;
}

/** Props for FieldError: all native `<p>` props, including `id` and `ref`. Children are the message text. */
export type FieldErrorProps = ComponentPropsWithRef<'p'>;

/**
 * Error message for one field: icon + text, so it does not rely on colour. Not a live region: on
 * submit the form-level error summary is announced instead, which avoids a burst of announcements.
 */
export function FieldError({ className, children, ...rest }: FieldErrorProps) {
  return (
    <p className={[styles.help, styles.error, className].filter(Boolean).join(' ')} {...rest}>
      <Icon name="alert-circle" size="sm" className={styles.icon} />
      <span>
        <span className={styles.visuallyHidden}>Error: </span>
        {children}
      </span>
    </p>
  );
}
