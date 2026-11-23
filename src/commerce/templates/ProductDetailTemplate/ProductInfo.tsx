import { useRef, useState } from 'react';
import { Heading } from '../../../components/Heading';
import { Text } from '../../../components/Text';
import { AddToCart, type AddToCartStatus } from '../../components/AddToCart';
import { DeliveryInfo, TrialBanner } from '../../components/DeliveryInfo';
import { DigitalDetails } from '../../components/DigitalDetails';
import { Price } from '../../components/Price';
import { ProductInfoAccordion } from '../../components/ProductInfoAccordion';
import { ProductTypeBadge } from '../../components/ProductTypeBadge';
import { BillingIntervalSelector, PurchaseOptionSelector } from '../../components/PurchaseOptionSelector';
import { QuantityStepper } from '../../components/QuantityStepper';
import { Rating } from '../../components/Rating';
import { SaleBadge } from '../../components/SaleBadge';
import { SizeGuide } from '../../components/SizeGuide';
import { StockBadge } from '../../components/StockBadge';
import { StickyBuyBar, useOutOfView } from '../../components/StickyBuyBar';
import { VariantSelector } from '../../components/VariantSelector';
import { WishlistButton } from '../../components/WishlistButton';
import { defaultPurchaseOption, purchaseSelectorKind } from '../../logic/options';
import { percentOff, subscriptionUnitPrice } from '../../logic/pricing';
import type { OptionAvailability, Selection } from '../../logic/variants';
import type { CommerceContext } from '../../types/context';
import type { Product, PurchaseOption, Variant } from '../../types/product';
import styles from './ProductDetailTemplate.module.css';

interface ProductInfoProps {
  product: Product;
  variant: Variant | undefined;
  selection: Selection;
  availability: Record<string, Record<string, OptionAvailability>>;
  onSelect: (name: string, value: string) => void;
  initialPurchaseOption?: PurchaseOption;
  /** Controlled wishlist state (ProductPage.inWishlist). Undefined: the button keeps its own state. */
  inWishlist?: boolean;
  ctx?: CommerceContext;
}

/** Why the buy button is disabled, as a short label and a full reason. */
function disabledState(product: Product, variant: Variant | undefined) {
  if (!variant) return { label: 'Choose an option', reason: `Choose ${product.options.map((o) => o.name.toLowerCase()).join(' and ')} to continue. This combination isn’t available.` };
  if (variant.stock.status === 'out-of-stock') return { label: 'Sold out', reason: 'This item is sold out. Choose another option or check back later.' };
  return undefined;
}

/**
 * The info column, in order: title (h1), rating link, price, badges, summary, purchase option or billing
 * interval, variants, size guide, quantity, trial banner, add to cart, wishlist, delivery, digital files
 * and the info accordion.
 */
export function ProductInfo({ product, variant, selection, onSelect, initialPurchaseOption, inWishlist, ctx }: ProductInfoProps) {
  const [option, setOption] = useState<PurchaseOption>(initialPurchaseOption ?? defaultPurchaseOption(product));
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<AddToCartStatus>('idle');
  const [ownSaved, setOwnSaved] = useState(false);
  const saved = inWishlist ?? ownSaved;
  const toggleWishlist = (next: boolean) => {
    if (inWishlist === undefined) setOwnSaved(next);
    ctx?.onWishlistToggle?.(product, next);
  };
  const shown = variant ?? product.variants[0]!;
  const subscription = option.type === 'subscription' ? option : undefined;
  const price = subscriptionUnitPrice(shown.price, option);
  const compareAt = subscription && price.amount < shown.price.amount * (subscription.priceMultiplier ?? 1) ? { ...shown.price, amount: shown.price.amount * (subscription.priceMultiplier ?? 1) } : option.type === 'one-time' ? shown.compareAtPrice : undefined;
  const selector = purchaseSelectorKind(product);
  const disabled = disabledState(product, variant);
  const showQuantity = product.kind === 'physical' && !subscription;
  const stockLimit = variant?.stock.status === 'low-stock' ? variant.stock.quantity : undefined;
  const ratingCount = product.rating?.count ?? 0;
  const buyRef = useRef<HTMLDivElement>(null);
  const buyOutOfView = useOutOfView(buyRef);
  const addProps = {
    kind: product.kind,
    status: disabled ? ('disabled' as const) : status,
    onAdd: () => add(),
    disabledLabel: disabled?.label,
    disabledReason: disabled?.reason,
    subscription: !!subscription,
    trial: !!subscription?.trialDays,
    preorder: variant?.stock.status === 'preorder',
    productTitle: product.title,
  };

  const add = () => {
    if (!variant || !ctx?.onAddToCart) return;
    const result = ctx.onAddToCart({ product, variantId: variant.id, quantity: showQuantity ? quantity : 1, purchaseOption: option });
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      setStatus('loading');
      (result as Promise<unknown>).then(() => setStatus('success'), () => setStatus('error'));
    } else {
      setStatus('success');
    }
  };
  const changeOption = (next: PurchaseOption) => {
    setOption(next);
    setStatus('idle');
  };

  return (
    <div className={styles.info}>
      <Heading as="h1" size="3xl" className={styles.title}>
        {product.title}
      </Heading>
      {ratingCount > 0 && <Rating value={product.rating!.average} count={ratingCount} href="#reviews" size="sm" />}
      <Price price={price} compareAt={compareAt} interval={subscription?.interval} trialDays={subscription?.trialDays} size="lg" />
      <div className={styles.badges}>
        <SaleBadge percent={option.type === 'one-time' ? percentOff(shown.price, shown.compareAtPrice) : subscription?.discountPercent} />
        <ProductTypeBadge kind={product.kind} />
        {variant && variant.stock.status !== 'in-stock' && <StockBadge stock={variant.stock} />}
      </div>
      {product.summary && <Text tone="muted">{product.summary}</Text>}
      {selector === 'interval' && <BillingIntervalSelector product={product} variant={shown} value={option} onChange={changeOption} />}
      {selector === 'options' && <PurchaseOptionSelector product={product} variant={shown} value={option} onChange={changeOption} />}
      {product.options.length > 0 && (
        <VariantSelector
          product={product}
          selection={selection}
          onChange={(name, value) => {
            onSelect(name, value);
            setStatus('idle');
          }}
        />
      )}
      <SizeGuide table={product.sizeGuide} productTitle={product.title} />
      {showQuantity && !disabled && <QuantityStepper value={quantity} onChange={setQuantity} maxFromStock={stockLimit} productTitle={product.title} />}
      <TrialBanner trialDays={subscription?.trialDays} />
      <div ref={buyRef} className={styles.buy}>
        <AddToCart {...addProps} />
        <WishlistButton pressed={saved} onPressedChange={toggleWishlist} productTitle={product.title} />
      </div>
      <DeliveryInfo product={product} purchaseOption={option} />
      {product.kind === 'digital' && <DigitalDetails digital={product.digital} />}
      <ProductInfoAccordion product={product} headingLevel={2} />
      {/* Narrow screens: the same AddToCart in a bar while the real one is scrolled away. Disabled: the status text instead. */}
      <StickyBuyBar
        shown={buyOutOfView}
        summary={
          <>
            <span className={styles.barTitle}>{product.title}</span>
            <Price price={price} compareAt={compareAt} interval={subscription?.interval} trialDays={subscription?.trialDays} size="sm" />
          </>
        }
      >
        {disabled ? <span className={styles.barStatus}>{disabled.label}</span> : <AddToCart {...addProps} secondary />}
      </StickyBuyBar>
    </div>
  );
}
