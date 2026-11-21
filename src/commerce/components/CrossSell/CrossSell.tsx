import type { Product, Variant } from '../../types/product';
import { RelatedProducts } from '../RelatedProducts';

export interface CrossSellProps {
  products: Product[];
  hrefFor: (product: Product) => string;
  onQuickAdd?: (product: Product, variant: Variant) => void;
}

/** "Complete your order": RelatedProducts with the cart page heading. Renders nothing for no products. */
export function CrossSell({ products, hrefFor, onQuickAdd }: CrossSellProps) {
  return <RelatedProducts products={products} hrefFor={hrefFor} onQuickAdd={onQuickAdd} heading="Complete your order" />;
}
