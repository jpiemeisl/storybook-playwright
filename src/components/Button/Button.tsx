import type { ButtonHTMLAttributes, MouseEvent, Ref } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual emphasis. */
  variant?: ButtonVariant;
  /** Control height and padding. */
  size?: ButtonSize;
  /**
   * Busy state: shows a spinner over the (still measured) label so the width does not change, sets
   * aria-busy, and ignores clicks and form submission. Uses aria-disabled rather than `disabled`
   * so a keyboard user's focus stays on the button.
   */
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  className,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], loading && styles.loading, className]
    .filter(Boolean)
    .join(' ');

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      type={type}
      className={classes}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={handleClick}
      {...rest}
    >
      <span className={styles.label}>{children}</span>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
    </button>
  );
}
