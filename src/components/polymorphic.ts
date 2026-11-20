import type { ComponentPropsWithoutRef, ElementType } from 'react';

/**
 * Props for a component that renders as element `E` (via `as`), with its own props `P`
 * taking precedence over the element's native props.
 */
export type PolymorphicProps<E extends ElementType, P = object> = P & {
  as?: E;
} & Omit<ComponentPropsWithoutRef<E>, keyof P | 'as'>;
