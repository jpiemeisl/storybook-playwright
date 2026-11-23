import type { ButtonHTMLAttributes, MouseEvent, Ref } from 'react';
import styles from './Button.module.css';

/** Visual emphasis of a Button or ButtonLink: `primary` for the main action, `secondary` for alternatives, `ghost` for low-emphasis actions. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
/** Height, padding and font size of a Button or ButtonLink. */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Props for Button. Accepts all native `<button>` attributes; `type` defaults to "button". */
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
  /** Ref to the underlying `<button>` element. */
  ref?: Ref<HTMLButtonElement>;
}

/**
 * A native `<button>` with the library's variants and sizes. Use for actions; use ButtonLink for navigation.
 *
 * Defaults to `type="button"` so it never submits a form by accident; pass `type="submit"` explicitly.
 */
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
