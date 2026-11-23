import { Children, type ReactNode } from 'react';
import { Grid, type ResponsiveColumns } from '../../../components/Grid';
import { ProductCardSkeleton } from '../ProductCard';
import styles from './ProductGrid.module.css';

/** Props for ProductGrid, the responsive list of product cards. */
export interface ProductGridProps {
  /** ProductCards. Each is wrapped in a list item. */
  children?: ReactNode;
  /** Total matching products, announced politely ("24 products"). Omit to hide the count. */
  count?: number;
  /** Show skeletons instead of children and mark the grid busy. */
  loading?: boolean;
  /** Skeletons while loading. Default 8. */
  skeletonCount?: number;
  /** Shown instead of the grid when there are no children and not loading. */
  empty?: ReactNode;
  /** Columns per container width. Default 2, then 3 from 45rem, 4 from 60rem. */
  columns?: ResponsiveColumns;
  /** Accessible name of the list. Default "Products". */
  label?: string;
}

const countText = (count: number) => `${new Intl.NumberFormat('en-US').format(count)} ${count === 1 ? 'product' : 'products'}`;

/** Product list on a container-query Grid, with loading skeletons, a polite result count and an empty slot. */
export function ProductGrid({ children, count, loading = false, skeletonCount = 8, empty, columns = { base: 2, md: 3, lg: 4 }, label = 'Products' }: ProductGridProps) {
  const items = Children.toArray(children);
  const isEmpty = !loading && items.length === 0;
  return (
    <div className={styles.root}>
      {count !== undefined && (
        <p className={styles.count} role="status">
          {loading ? 'Loading products' : countText(count)}
        </p>
      )}
      {isEmpty && empty ? (
        empty
      ) : (
        <Grid as="ul" columns={columns} gap="md" className={styles.grid} aria-label={label} aria-busy={loading || undefined}>
          {loading
            ? Array.from({ length: skeletonCount }, (_, i) => (
                <li key={i} className={styles.item}>
                  <ProductCardSkeleton />
                </li>
              ))
            : items.map((child, i) => (
                <li key={i} className={styles.item}>
                  {child}
                </li>
              ))}
        </Grid>
      )}
    </div>
  );
}
