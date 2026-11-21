import { Link, type LinkProps } from '../Link';
import type { ButtonSize, ButtonVariant } from './Button';
import styles from './Button.module.css';

export interface ButtonLinkProps extends Omit<LinkProps, 'variant' | 'unstyled'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** A Link (through LinkProvider) that looks like a Button. Use for navigation; use Button for actions. */
export function ButtonLink({ variant = 'primary', size = 'md', externalIcon = false, className, ...rest }: ButtonLinkProps) {
  const classes = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ');
  return <Link unstyled externalIcon={externalIcon} className={classes} {...rest} />;
}
