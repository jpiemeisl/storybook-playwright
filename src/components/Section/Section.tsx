import type { ElementType } from 'react';
import type { PolymorphicProps } from '../polymorphic';
import styles from './Section.module.css';

/** Background of a Section. `inverse` also switches child components to their inverse-surface colors. */
export type SectionBackground = 'default' | 'subtle' | 'accent' | 'inverse';
/** Vertical padding of a Section, from the section spacing scale. */
export type SectionPadding = 'none' | 'sm' | 'md' | 'lg';

interface SectionOwnProps {
  /** Background color. `inverse` sets data-surface="inverse" for the children. */
  background?: SectionBackground;
  /** Vertical padding from the section spacing scale. */
  padding?: SectionPadding;
}

/** Props for Section. Polymorphic: `as` picks the element (default `section`). */
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
