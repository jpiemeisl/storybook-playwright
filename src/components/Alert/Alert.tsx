import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import styles from './Alert.module.css';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  tone?: AlertTone;
  title?: ReactNode;
  /** Shows a dismiss button that calls this. */
  onDismiss?: () => void;
  /** role="alert" (interrupts) instead of the default role="status" (polite). Use sparingly. */
  urgent?: boolean;
}

const toneMeta: Record<AlertTone, { icon: IconName; label: string }> = {
  info: { icon: 'info', label: 'Information' },
  success: { icon: 'check-circle', label: 'Success' },
  warning: { icon: 'alert-triangle', label: 'Warning' },
  danger: { icon: 'alert-circle', label: 'Error' },
};

/** Inline feedback message. Tone is conveyed by icon and a hidden "Error:" style prefix, not colour alone. */
export function Alert({ tone = 'info', title, onDismiss, urgent = false, className, children, ...rest }: AlertProps) {
  const { icon, label } = toneMeta[tone];
  return (
    <div role={urgent ? 'alert' : 'status'} className={[styles.alert, styles[tone], className].filter(Boolean).join(' ')} {...rest}>
      <Icon name={icon} className={styles.icon} />
      <div className={styles.content}>
        {title && (
          <p className={styles.title}>
            <span className={styles.visuallyHidden}>{label}: </span>
            {title}
          </p>
        )}
        {children && (
          <div className={styles.body}>
            {!title && <span className={styles.visuallyHidden}>{label}: </span>}
            {children}
          </div>
        )}
      </div>
      {onDismiss && (
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
          <Icon name="close" size="sm" />
        </button>
      )}
    </div>
  );
}
