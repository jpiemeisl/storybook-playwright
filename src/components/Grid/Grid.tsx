import type { CSSProperties, ElementType } from 'react';
import type { Gap } from '../gap';
import type { PolymorphicProps } from '../polymorphic';
import styles from './Grid.module.css';

/** Column counts per container width: base (<30rem), sm (≥30rem), md (≥45rem), lg (≥60rem). */
export interface ResponsiveColumns {
  base?: number;
  sm?: number;
  md?: number;
  lg?: number;
}

interface GridOwnProps {
  /**
   * A number is the column count for wide slots; narrower slots step down to 3, 2 then 1.
   * Pass an object for exact control. Ignored when `minItemWidth` is set.
   */
  columns?: number | ResponsiveColumns;
  /** CSS length, e.g. "16rem". Fits as many columns as possible with items at least this wide. */
  minItemWidth?: string;
  /** Space between rows and columns, from the spacing tokens. */
  gap?: Gap;
}

/** Props for Grid. Polymorphic: `as` picks the element (default `div`). The grid is wrapped in a slot `div` that acts as the query container. */
export type GridProps<E extends ElementType = 'div'> = PolymorphicProps<E, GridOwnProps>;

type GridVars = CSSProperties & Partial<Record<'--grid-base' | '--grid-sm' | '--grid-md' | '--grid-lg' | '--grid-min', string | number>>;

function resolveColumns(columns: number | ResponsiveColumns): Required<ResponsiveColumns> {
  if (typeof columns === 'number') {
    return { base: 1, sm: Math.min(columns, 2), md: Math.min(columns, 3), lg: columns };
  }
  const base = columns.base ?? 1;
  const sm = columns.sm ?? base;
  const md = columns.md ?? sm;
  const lg = columns.lg ?? md;
  return { base, sm, md, lg };
}

/**
 * Two-dimensional grid that responds to the width of its own slot (container queries),
 * not the viewport, so the same Grid works in a sidebar or a full-width section.
 */
export function Grid<E extends ElementType = 'div'>({
  as,
  columns = 3,
  minItemWidth,
  gap = 'md',
  className,
  style,
  ...rest
}: GridProps<E>) {
  const Component: ElementType = as ?? 'div';
  const cols = resolveColumns(columns);
  const vars: GridVars = minItemWidth
    ? { '--grid-min': minItemWidth }
    : { '--grid-base': cols.base, '--grid-sm': cols.sm, '--grid-md': cols.md, '--grid-lg': cols.lg };
  const classes = [styles.grid, styles[`gap-${gap}`], minItemWidth && styles.autoFit, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.slot}>
      <Component className={classes} style={{ ...vars, ...style }} {...rest} />
    </div>
  );
}
