import type { ElementType } from 'react';
import type { PolymorphicProps } from '../polymorphic';
import styles from './Section.module.css';

export type SectionBackground = 'default' | 'subtle' | 'accent' | 'inverse';
export type SectionPadding = 'none' | 'sm' | 'md' | 'lg';

interface SectionOwnProps {
  background?: SectionBackground;
  /** Vertical padding from the section spacing scale. */
  padding?: SectionPadding;
}

export type SectionProps<E extends ElementType = 'section'> = PolymorphicProps<E, SectionOwnProps>;

/**
 * Full-width band with a background and vertical rhythm. `inverse` sets data-surface="inverse",
 * which remaps the semantic colour tokens so child components stay readable.
 */
export function Section<E extends ElementType = 'section'>({
  as,
  background = 'default',
  padding = 'md',
  className,
  ...rest
}: SectionProps<E>) {
  const Component: ElementType = as ?? 'section';
  const classes = [styles.section, styles[`bg-${background}`], styles[`pad-${padding}`], className]
    .filter(Boolean)
    .join(' ');
  return (
    <Component data-surface={background === 'inverse' ? 'inverse' : undefined} className={classes} {...rest} />
  );
}
