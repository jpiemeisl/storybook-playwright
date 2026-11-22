import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import type { ThemeName } from './themes';

export interface ThemeProps extends HTMLAttributes<HTMLElement> {
  /** Theme to apply to this subtree. */
  name: ThemeName;
  /** Element to render. Default `div`. */
  as?: ElementType;
  children?: ReactNode;
}

/**
 * Applies a theme to its subtree by rendering one element with data-theme. Themes nest: a <Theme> inside
 * another uses its own tokens. The element paints its own background and text colour (base.css).
 * No storage, no effects, no preference detection: SSR-safe. The host decides which theme to show.
 */
export function Theme({ name, as: Component = 'div', children, ...rest }: ThemeProps) {
  return (
    <Component data-theme={name} {...rest}>
      {children}
    </Component>
  );
}
