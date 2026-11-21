import type { AnchorHTMLAttributes } from 'react';
import { Icon } from '../Icon';
import { useLinkComponent } from './LinkProvider';
import styles from './Link.module.css';

export type LinkVariant = 'inline' | 'standalone';

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  /** `inline` sits inside running text; `standalone` is a call to action on its own line. */
  variant?: LinkVariant;
  /**
   * Treat as an external link: renders a plain `<a>` with rel="noopener noreferrer" and an icon.
   * Defaults to true for absolute http(s) URLs.
   */
  external?: boolean;
  /** Show the external-link icon on external links. Turn off for icon-only links. Default true. */
  externalIcon?: boolean;
  /** Drop the Link's own styling so `className` fully controls the look (e.g. ButtonLink, card titles). */
  unstyled?: boolean;
}

const ABSOLUTE_URL = /^(https?:)?\/\//i;

export function Link({
  href,
  variant = 'inline',
  external,
  externalIcon = true,
  unstyled = false,
  className,
  rel,
  target,
  children,
  ...rest
}: LinkProps) {
  const LinkComponent = useLinkComponent();
  const isExternal = external ?? ABSOLUTE_URL.test(href);
  const classes = (unstyled ? [className] : [styles.link, styles[variant], className]).filter(Boolean).join(' ');

  if (!isExternal) {
    return (
      <LinkComponent href={href} className={classes} rel={rel} target={target} {...rest}>
        {children}
      </LinkComponent>
    );
  }

  const relValues = new Set(['noopener', 'noreferrer', ...(rel?.split(/\s+/).filter(Boolean) ?? [])]);
  return (
    <a href={href} className={classes} rel={[...relValues].join(' ')} target={target} {...rest}>
      {children}
      {externalIcon && <Icon name="external-link" size="sm" className={styles.icon} />}
      {target === '_blank' && <span className={styles.visuallyHidden}> (opens in a new tab)</span>}
    </a>
  );
}
