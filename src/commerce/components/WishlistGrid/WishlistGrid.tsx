import { EmptyState } from '../../../components/EmptyState';
import type { WishlistItem } from '../../types/account';
import type { Product, Variant } from '../../types/product';
import { ProductCard } from '../ProductCard';
import { ProductGrid } from '../ProductGrid';
import { WishlistButton } from '../WishlistButton';
import styles from './WishlistGrid.module.css';

export interface WishlistGridProps {
  items: WishlistItem[];
  /** Products to look the items up in (unknown ids are skipped). */
  products: readonly Product[];
  hrefFor: (product: Product) => string;
  onRemove: (productId: string) => void;
  /** Quick add, where the product card allows it (single purchasable variant). */
  onQuickAdd?: (product: Product, variant: Variant) => void;
  /** "Browse the shop" link for the empty state. */
  shopHref?: string;
}

/**
 * The wishlist: ProductCards (stock status shown as text by the card) on a ProductGrid, each with a
 * "Remove <title> from wishlist" button, the newest first. Quick add follows the card's own rules.
 */
export function WishlistGrid({ items, products, hrefFor, onRemove, onQuickAdd, shopHref = '/shop' }: WishlistGridProps) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const shown = [...items].sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1)).flatMap((i) => (byId.has(i.productId) ? [byId.get(i.productId)!] : []));
  if (shown.length === 0) return <EmptyState title="Your wishlist is empty" message="Tap the heart on any product to save it for later." action={{ label: 'Browse the shop', href: shopHref }} />;
  return (
    <ProductGrid count={shown.length} label="Saved products">
      {shown.map((product) => (
        <div key={product.id} className={styles.item}>
          <ProductCard product={product} href={hrefFor(product)} headingLevel={2} quickAction={onQuickAdd ? 'add' : undefined} onQuickAdd={onQuickAdd} />
          <div className={styles.remove}>
            <WishlistButton action="remove" pressed onPressedChange={() => onRemove(product.id)} productTitle={product.title} />
          </div>
        </div>
      ))}
    </ProductGrid>
  );
}
