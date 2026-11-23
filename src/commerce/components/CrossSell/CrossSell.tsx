import type { Product, Variant } from '../../types/product';
import { RelatedProducts } from '../RelatedProducts';

/** Props for CrossSell, the "Complete your order" product carousel on the cart page. */
export interface CrossSellProps {
  products: Product[];
  /** Returns the product page URL for each product. */
  hrefFor: (product: Product) => string;
  /** Enables each card's quick "Add to cart" button and is called with the product and its single variant. */
  onQuickAdd?: (product: Product, variant: Variant) => void;
}

/** "Complete your order": RelatedProducts with the cart page heading. Renders nothing for no products. */
export function CrossSell({ products, hrefFor, onQuickAdd }: CrossSellProps) {
  return <RelatedProducts products={products} hrefFor={hrefFor} onQuickAdd={onQuickAdd} heading="Complete your order" />;
}
