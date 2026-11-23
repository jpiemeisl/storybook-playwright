import type { ElementType } from 'react';
import type { PolymorphicProps } from '../polymorphic';
import styles from './Container.module.css';

/** Maximum content width of a Container. `full` has no max width and only applies the side gutters. */
export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ContainerOwnProps {
  /** Maximum content width. `full` only applies the side gutters. */
  size?: ContainerSize;
}

/** Props for Container. Polymorphic: `as` picks the element (default `div`). */
export type ContainerProps<E extends ElementType = 'div'> = PolymorphicProps<E, ContainerOwnProps>;

/** Centres content at a max width with fluid side gutters. Nested containers don't add a second gutter. */
export function Container<E extends ElementType = 'div'>({ as, size = 'lg', className, ...rest }: ContainerProps<E>) {
  const Component: ElementType = as ?? 'div';
  const classes = [styles.container, styles[size], className].filter(Boolean).join(' ');
  return <Component className={classes} {...rest} />;
}
