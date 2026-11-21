import { Carousel } from '../../../components/Carousel';
import { Heading } from '../../../components/Heading';
import type { Product, Variant } from '../../types/product';
import { ProductCard } from '../ProductCard';
import styles from './RelatedProducts.module.css';

export interface RelatedProductsProps {
  products: Product[];
  hrefFor: (product: Product) => string;
  heading?: string;
  onQuickAdd?: (product: Product, variant: Variant) => void;
}

/** "You might also like": h2 plus the existing Carousel of ProductCards (h3). Renders nothing for none. */
export function RelatedProducts({ products, hrefFor, heading = 'You might also like', onQuickAdd }: RelatedProductsProps) {
  const shown = products.slice(0, 12);
  if (shown.length === 0) return null;
  return (
    <section className={styles.root} aria-labelledby="related-products">
      <Heading as="h2" size="xl" id="related-products">
        {heading}
      </Heading>
      <Carousel label={heading} slidesPerView={{ base: 2, md: 3, lg: 4 }}>
        {shown.map((product) => (
          <ProductCard key={product.id} product={product} href={hrefFor(product)} quickAction={onQuickAdd ? 'add' : undefined} onQuickAdd={onQuickAdd} />
        ))}
      </Carousel>
    </section>
  );
}
