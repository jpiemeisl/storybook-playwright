import { useEffect, useMemo, useState } from 'react';
import { Breadcrumbs } from '../../../components/Breadcrumbs';
import { Container } from '../../../components/Container';
import { Heading } from '../../../components/Heading';
import type { PageContent } from '../../../content-types/blocks';
import { isObj } from '../../../registry/checker';
import { PageSection } from '../../../registry/BlockRenderer';
import { SiteLayout } from '../../../templates/SiteLayout';
import { layoutProps } from '../../../templates/TemplateBlocks';
import type { TemplateProps } from '../../../templates/types';
import { ProductGallery } from '../../components/ProductGallery';
import { RelatedProducts } from '../../components/RelatedProducts';
import { ReviewList, ReviewSummary } from '../../components/Reviews';
import { useVariantSelection } from '../../hooks/useVariantSelection';
import type { ReviewSort } from '../../logic/reviews';
import { defaultProductHref, type CommerceContext } from '../../types/context';
import type { ProductPage } from '../../types/pages';
import { ProductInfo } from './ProductInfo';
import styles from './ProductDetailTemplate.module.css';

export const canRenderProductDetail = (page: PageContent) => {
  const { product, reviews } = page as Partial<ProductPage>;
  return isObj(product) && Array.isArray(product.variants) && product.variants.length > 0 && isObj(reviews);
};

/**
 * Product detail: breadcrumbs, gallery (sticky on wide containers) beside the info column, then
 * reviews (#reviews) and related products. Selection state lives here (useVariantSelection); the host
 * owns the cart through ctx.onAddToCart and hears about selection changes through ctx.onSelectionChange.
 */
export function ProductDetailTemplate({ page, chrome, ctx }: TemplateProps<ProductPage> & { ctx?: CommerceContext }) {
  const { product, reviews, related } = page;
  const { selection, select, variant, availability } = useVariantSelection(product, page.initialSelection);
  const [imageIndex, setImageIndex] = useState(variant?.imageIndex ?? 0);
  const [reviewSort, setReviewSort] = useState<ReviewSort>('newest');
  const href = ctx?.productHref ?? defaultProductHref;

  // The gallery follows the selected variant's image.
  useEffect(() => {
    if (variant?.imageIndex !== undefined) setImageIndex(variant.imageIndex);
  }, [variant?.id, variant?.imageIndex]);

  const onSelectionChange = ctx?.onSelectionChange;
  useEffect(() => {
    onSelectionChange?.(selection);
  }, [selection, onSelectionChange]);

  const relatedProducts = useMemo(() => related.filter((p) => p.id !== product.id), [related, product.id]);

  return (
    <SiteLayout chrome={chrome} {...layoutProps(ctx)}>
      <PageSection>
        <Container size="xl">
          <div className={styles.root}>
            {page.breadcrumbs?.length ? <Breadcrumbs items={page.breadcrumbs} /> : null}
            <div className={styles.layout}>
              <div className={styles.gallery}>
                <ProductGallery images={product.images} index={imageIndex} onIndexChange={setImageIndex} title={product.title} />
              </div>
              <ProductInfo product={product} variant={variant} selection={selection} availability={availability} onSelect={select} initialPurchaseOption={page.initialPurchaseOption} ctx={ctx} />
            </div>
          </div>
        </Container>
      </PageSection>
      <PageSection background="subtle" id="reviews" aria-label="Reviews">
        <Container size="xl">
          <div className={styles.reviews}>
            <Heading as="h2" size="xl">
              Reviews
            </Heading>
            <div className={styles.reviewsLayout}>
              <ReviewSummary summary={reviews.summary} />
              <ReviewList reviews={reviews.reviews} sort={reviewSort} onSortChange={setReviewSort} />
            </div>
          </div>
        </Container>
      </PageSection>
      {relatedProducts.length > 0 && (
        <PageSection>
          <Container size="xl">
            <RelatedProducts products={relatedProducts} hrefFor={href} onQuickAdd={ctx?.onQuickAdd} />
          </Container>
        </PageSection>
      )}
    </SiteLayout>
  );
}
