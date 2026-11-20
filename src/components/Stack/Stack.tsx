import type { ElementType } from 'react';
import type { Gap } from '../gap';
import type { PolymorphicProps } from '../polymorphic';
import styles from './Stack.module.css';

export type StackDirection = 'row' | 'column';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'center' | 'end' | 'between';

interface StackOwnProps {
  direction?: StackDirection;
  gap?: Gap;
  /** Cross-axis alignment. */
  align?: StackAlign;
  /** Main-axis distribution. */
  justify?: StackJustify;
  wrap?: boolean;
}

export type StackProps<E extends ElementType = 'div'> = PolymorphicProps<E, StackOwnProps>;

/** One-dimensional flex layout with token-based gaps. */
export function Stack<E extends ElementType = 'div'>({
  as,
  direction = 'column',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className,
  ...rest
}: StackProps<E>) {
  const Component: ElementType = as ?? 'div';
  const classes = [
    styles.stack,
    styles[direction],
    styles[`gap-${gap}`],
    styles[`align-${align}`],
    styles[`justify-${justify}`],
    wrap && styles.wrap,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <Component className={classes} {...rest} />;
}
