/*
 * Building cart lines from catalogue products. Pure: the caller supplies the line id.
 */
import type { CartLine } from '../types/cart';
import type { Product, PurchaseOption } from '../types/product';

/** Same purchase option (type, interval, discount and trial). */
export function samePurchaseOption(a: PurchaseOption, b: PurchaseOption): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'one-time' || b.type === 'one-time') return true;
  return a.interval.unit === b.interval.unit && a.interval.count === b.interval.count && (a.discountPercent ?? 0) === (b.discountPercent ?? 0) && (a.trialDays ?? 0) === (b.trialDays ?? 0) && (a.priceMultiplier ?? 1) === (b.priceMultiplier ?? 1);
}

/** Lines that should merge: same product, variant and purchase option. */
export const sameLine = (a: Pick<CartLine, 'productId' | 'variantId' | 'purchaseOption'>, b: Pick<CartLine, 'productId' | 'variantId' | 'purchaseOption'>) =>
  a.productId === b.productId && a.variantId === b.variantId && samePurchaseOption(a.purchaseOption, b.purchaseOption);

/**
 * A cart line for a product variant, with its display snapshot. Returns undefined when the variant
 * does not exist. `purchaseOption` defaults to the product's first purchase option.
 */
export function cartLineFromProduct(product: Product, variantId: string, quantity: number, id: string, purchaseOption?: PurchaseOption): CartLine | undefined {
  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant) return undefined;
  const image = product.images[variant.imageIndex ?? 0];
  const option = purchaseOption ?? product.purchaseOptions[0] ?? { type: 'one-time' };
  return {
    id,
    productId: product.id,
    variantId,
    quantity,
    purchaseOption: option,
    snapshot: {
      title: product.title,
      ...(product.options.length ? { variantTitle: variant.title } : {}),
      ...(image ? { image } : {}),
      unitPrice: variant.price,
      ...(variant.compareAtPrice ? { compareAtPrice: variant.compareAtPrice } : {}),
      kind: product.kind,
      requiresShipping: product.kind === 'physical',
    },
  };
}
