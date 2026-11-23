import type { ElementType } from 'react';
import type { PolymorphicProps } from '../polymorphic';
import styles from './Text.module.css';

/** Step on the body type scale used by Text. */
export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
/** Semantic color role of Text: `muted` and `subtle` for secondary copy, `danger` and `success` for status. */
export type TextTone = 'default' | 'muted' | 'subtle' | 'danger' | 'success';
/** Font weight of Text. */
export type TextWeight = 'regular' | 'strong';

interface TextOwnProps {
  /** Step on the type scale. */
  size?: TextSize;
  /** Colour role. */
  tone?: TextTone;
  /** Font weight. */
  weight?: TextWeight;
}

/** Props for Text. Polymorphic: `as` picks the element (default `p`) and its props are accepted too. */
export type TextProps<E extends ElementType = 'p'> = PolymorphicProps<E, TextOwnProps>;

/** Body text on the type scale with a semantic color tone. Renders a `<p>` unless `as` says otherwise; use Heading for headings. */
export function Text<E extends ElementType = 'p'>({
  as,
  size = 'md',
  tone = 'default',
  weight = 'regular',
  className,
  ...rest
}: TextProps<E>) {
  const Component: ElementType = as ?? 'p';
  const classes = [styles.text, styles[`size-${size}`], styles[`tone-${tone}`], styles[`weight-${weight}`], className]
    .filter(Boolean)
    .join(' ');
  return <Component className={classes} {...rest} />;
}
