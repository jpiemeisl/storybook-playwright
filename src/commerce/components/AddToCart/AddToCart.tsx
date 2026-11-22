import { useId } from 'react';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import type { ProductKind } from '../../types/product';
import styles from './AddToCart.module.css';

export type AddToCartStatus = 'idle' | 'loading' | 'success' | 'error' | 'disabled';

export interface AddToCartProps {
  kind: ProductKind;
  status: AddToCartStatus;
  onAdd: () => void;
  /** Why it is disabled (shown and linked with aria-describedby), e.g. "This item is sold out." */
  disabledReason?: string;
  /** Short label while disabled. Default "Sold out". Use "Choose an option" when a selection is missing. */
  disabledLabel?: string;
  /** Purchase is a subscription (changes the label to "Subscribe"). */
  subscription?: boolean;
  /** Subscription with a free trial ("Start free trial"). */
  trial?: boolean;
  /** Variant is a pre-order. */
  preorder?: boolean;
  /** For announcements: "Added Stoneware mug to your cart". */
  productTitle: string;
  /**
   * A second copy of the same button (e.g. in StickyBuyBar): same label, status and disabled behaviour,
   * but no live region and no reason or error text, which the primary copy already shows and announces.
   */
  secondary?: boolean;
}

/** The label for a kind and state. */
export function addToCartLabel({ kind, status, disabledLabel = 'Sold out', subscription, trial, preorder }: Pick<AddToCartProps, 'kind' | 'status' | 'disabledLabel' | 'subscription' | 'trial' | 'preorder'>): string {
  if (status === 'disabled') return disabledLabel;
  if (status === 'loading') return 'Adding…';
  if (status === 'success') return 'Added to cart';
  if (status === 'error') return 'Try again';
  if (trial) return 'Start free trial';
  if (subscription || kind === 'subscription') return 'Subscribe';
  if (preorder) return 'Pre-order';
  if (kind === 'digital') return 'Buy and download';
  return 'Add to cart';
}

/**
 * The main buy button: full width so its size never changes between states. Disabled states stay
 * focusable (aria-disabled) and point at a visible reason; outcomes are announced in a polite live region.
 */
export function AddToCart({ kind, status, onAdd, disabledReason, disabledLabel, subscription, trial, preorder, productTitle, secondary = false }: AddToCartProps) {
  const reasonId = useId();
  const disabled = status === 'disabled';
  const label = addToCartLabel({ kind, status, disabledLabel, subscription, trial, preorder });
  const message = status === 'success' ? `Added ${productTitle} to your cart.` : status === 'error' ? `Couldn’t add ${productTitle} to your cart. Please try again.` : '';
  return (
    <div className={styles.root}>
      <Button
        size="lg"
        className={styles.button}
        loading={status === 'loading'}
        aria-disabled={disabled || undefined}
        aria-describedby={disabled && disabledReason && !secondary ? reasonId : undefined}
        onClick={() => {
          if (!disabled && status !== 'loading') onAdd();
        }}
        data-status={status}
      >
        {status === 'success' && <Icon name="check" size="sm" />}
        {label}
      </Button>
      {disabled && disabledReason && !secondary && (
        <p id={reasonId} className={styles.reason}>
          {disabledReason}
        </p>
      )}
      {status === 'error' && !secondary && <p className={styles.error}>Something went wrong. Please try again.</p>}
      {!secondary && (
        <span className={styles.visuallyHidden} role="status">
          {message}
        </span>
      )}
    </div>
  );
}
