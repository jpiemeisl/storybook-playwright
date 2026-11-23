import type { ElementType } from 'react';
import type { PolymorphicProps } from '../polymorphic';
import styles from './Heading.module.css';

/** Step on the heading type scale. Controls visual size only, not the heading level. */
export type HeadingSize = 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

interface HeadingOwnProps {
  /** Step on the type scale. Independent of the semantic level set by `as`. */
  size?: HeadingSize;
}

/** Props for Heading. Polymorphic: `as` sets the element (default `h2`) and its props are accepted too. */
export type HeadingProps<E extends ElementType = 'h2'> = PolymorphicProps<E, HeadingOwnProps>;

/**
 * A heading styled on the heading type scale. Renders an `<h2>` by default.
 *
 * Set `as` to the level the document outline needs and `size` to the look you want; the two are independent.
 */
export function Heading<E extends ElementType = 'h2'>({ as, size = 'xl', className, ...rest }: HeadingProps<E>) {
  const Component: ElementType = as ?? 'h2';
  const classes = [styles.heading, styles[`size-${size}`], className].filter(Boolean).join(' ');
  return <Component className={classes} {...rest} />;
}
