import { Button } from '../../../components/Button';
import { Heading } from '../../../components/Heading';
import { Icon } from '../../../components/Icon';
import { Image } from '../../../components/Image';
import { Link } from '../../../components/Link';
import { getPriceSummary, getProductAvailability } from '../../logic/browse';
import { optionSummary } from '../../logic/options';
import { isPurchasable } from '../../logic/variants';
import type { Product, Variant } from '../../types/product';
import { Price } from '../Price';
import { ProductTypeBadge } from '../ProductTypeBadge';
import { Rating } from '../Rating';
import { SaleBadge } from '../SaleBadge';
import { StockBadge } from '../StockBadge';
import styles from './ProductCard.module.css';

export interface ProductCardProps {
  product: Product;
  /** Product page URL. */
  href: string;
  /** Heading level of the title. Default 3 (cards sit in sections with an h2). */
  headingLevel?: 2 | 3 | 4;
  /** CSS aspect ratio of the image area. Default "4 / 5". */
  imageAspectRatio?: string;
  orientation?: 'vertical' | 'horizontal';
  /**
   * `add`: a separate "Add to cart" button for single-variant, purchasable physical or digital products
   * (others fall back to `choose-options`). `choose-options`: a visual cue, shown only for products with
   * several variants or purchase options; the title link opens the product.
   */
  quickAction?: 'add' | 'choose-options';
  onQuickAdd?: (product: Product, variant: Variant) => void;
  /** Show "No reviews yet" instead of hiding the rating. */
  showEmptyRating?: boolean;
  /** Show "8 sizes" style option summary. Default true. */
  showOptionSummary?: boolean;
}

/** The variant a quick add would use, or undefined when the product needs a choice or cannot be bought now. */
export function quickAddVariant(product: Product): Variant | undefined {
  if (product.kind === 'subscription' || product.variants.length !== 1) return undefined;
  const variant = product.variants[0]!;
  return isPurchasable(variant) ? variant : undefined;
}

/**
 * Product listing card. The title is the card's only link (its hit area covers the card); the quick
 * add, when shown, is a separate button above it. Sold-out products stay visible with text.
 */
export function ProductCard({
  product,
  href,
  headingLevel = 3,
  imageAspectRatio = '4 / 5',
  orientation = 'vertical',
  quickAction,
  onQuickAdd,
  showEmptyRating = false,
  showOptionSummary = true,
}: ProductCardProps) {
  const summary = getPriceSummary(product);
  const availability = getProductAvailability(product);
  const image = product.images[0];
  const ratingCount = product.rating?.count ?? 0;
  const quickVariant = quickAction === 'add' ? quickAddVariant(product) : undefined;
  const needsChoice = product.variants.length > 1 || product.purchaseOptions.length > 1;
  const showChoose = needsChoice && availability !== 'out-of-stock' && (quickAction === 'choose-options' || (quickAction === 'add' && !quickVariant));
  const firstVariant = product.variants[0];
  const stockForBadge = availability === 'in-stock' ? undefined : product.variants.length === 1 && firstVariant ? firstVariant.stock : { status: availability };
  const extraBadges = (product.badges ?? []).filter((badge) => badge.toLowerCase() !== 'sale').slice(0, 2);
  const options = showOptionSummary ? optionSummary(product) : undefined;

  return (
    // The article is the size container; the inner card responds to its width (horizontal from 30rem).
    <article className={styles.root}>
      <div className={[styles.card, styles[orientation], availability === 'out-of-stock' && styles.soldOut].filter(Boolean).join(' ')}>
        <div className={styles.media} style={{ aspectRatio: imageAspectRatio }}>
          {image ? (
            <Image {...image} alt={image.alt} aspectRatio={imageAspectRatio} className={styles.image} />
          ) : (
            <div className={styles.placeholder} aria-hidden="true">
              <Icon name="tag" size="xl" />
            </div>
          )}
          {(summary.onSale || extraBadges.length > 0) && (
            <div className={styles.badges}>
              {summary.onSale && <SaleBadge percent={summary.maxDiscountPercent} size="sm" />}
              {extraBadges.map((badge) => (
                <span key={badge} className={styles.badge}>
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={styles.body}>
          <ProductTypeBadge kind={product.kind} size="sm" />
          <Heading as={`h${headingLevel}` as const} size="md" className={styles.title}>
            <Link href={href} unstyled className={styles.link}>
              {product.title}
            </Link>
          </Heading>
          <Price price={summary.min} compareAt={summary.hasRange ? undefined : product.variants[0]?.compareAtPrice} from={summary.hasRange} interval={summary.interval} size="sm" />
          {(ratingCount > 0 || showEmptyRating) && <Rating value={product.rating?.average ?? 0} count={ratingCount} size="sm" />}
          {options && <p className={styles.meta}>{options}</p>}
          {stockForBadge && <StockBadge stock={stockForBadge} size="sm" />}
          {quickVariant && onQuickAdd && (
            <div className={styles.action}>
              {/* The name starts with the visible label (WCAG 2.5.3) and adds which product. */}
              <Button size="sm" variant="secondary" onClick={() => onQuickAdd(product, quickVariant)} aria-label={`Add to cart: ${product.title}`}>
                Add to cart
              </Button>
            </div>
          )}
          {showChoose && (
            // Not a second link: a cue only. Clicks pass through to the title link's stretched area.
            <span className={styles.choose} aria-hidden="true">
              Choose options
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/** Same footprint as ProductCard (image area plus text lines), for loading states. */
export function ProductCardSkeleton({ imageAspectRatio = '4 / 5' }: { imageAspectRatio?: string }) {
  return (
    <div className={[styles.card, styles.skeleton].join(' ')} aria-hidden="true">
      <div className={[styles.media, styles.shimmer].join(' ')} style={{ aspectRatio: imageAspectRatio }} />
      <div className={styles.body}>
        <span className={[styles.line, styles.shimmer].join(' ')} style={{ inlineSize: '40%' }} />
        <span className={[styles.line, styles.lineLg, styles.shimmer].join(' ')} />
        <span className={[styles.line, styles.shimmer].join(' ')} style={{ inlineSize: '30%' }} />
        <span className={[styles.line, styles.shimmer].join(' ')} style={{ inlineSize: '55%' }} />
      </div>
    </div>
  );
}
