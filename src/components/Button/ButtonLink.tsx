import { Link, type LinkProps } from '../Link';
import type { ButtonSize, ButtonVariant } from './Button';
import styles from './Button.module.css';

/** Props for ButtonLink: Link props (minus `variant` and `unstyled`) plus the Button variant and size. The external-link icon is off by default. */
export interface ButtonLinkProps extends Omit<LinkProps, 'variant' | 'unstyled'> {
  /** Visual emphasis, matching Button. */
  variant?: ButtonVariant;
  /** Control height and padding, matching Button. */
  size?: ButtonSize;
}

/** A Link (through LinkProvider) that looks like a Button. Use for navigation; use Button for actions. */
export function ButtonLink({ variant = 'primary', size = 'md', externalIcon = false, className, ...rest }: ButtonLinkProps) {
  const classes = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ');
  return <Link unstyled externalIcon={externalIcon} className={classes} {...rest} />;
}
