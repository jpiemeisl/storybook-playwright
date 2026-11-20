import type { ElementType } from 'react';
import type { PolymorphicProps } from '../polymorphic';
import styles from './Text.module.css';

export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TextTone = 'default' | 'muted' | 'subtle' | 'danger' | 'success';
export type TextWeight = 'regular' | 'strong';

interface TextOwnProps {
  /** Step on the type scale. */
  size?: TextSize;
  /** Colour role. */
  tone?: TextTone;
  weight?: TextWeight;
}

export type TextProps<E extends ElementType = 'p'> = PolymorphicProps<E, TextOwnProps>;

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
