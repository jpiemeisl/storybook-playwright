import type { ElementType } from 'react';
import type { PolymorphicProps } from '../polymorphic';
import styles from './Heading.module.css';

export type HeadingSize = 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

interface HeadingOwnProps {
  /** Step on the type scale. Independent of the semantic level set by `as`. */
  size?: HeadingSize;
}

export type HeadingProps<E extends ElementType = 'h2'> = PolymorphicProps<E, HeadingOwnProps>;

export function Heading<E extends ElementType = 'h2'>({ as, size = 'xl', className, ...rest }: HeadingProps<E>) {
  const Component: ElementType = as ?? 'h2';
  const classes = [styles.heading, styles[`size-${size}`], className].filter(Boolean).join(' ');
  return <Component className={classes} {...rest} />;
}
