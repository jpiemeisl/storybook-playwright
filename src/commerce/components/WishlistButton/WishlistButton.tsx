import { Icon } from '../../../components/Icon';
import styles from './WishlistButton.module.css';

/** Props for WishlistButton, the heart button that saves a product to the wishlist. */
export interface WishlistButtonProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  productTitle: string;
  /**
   * `toggle` (default): aria-pressed with the constant name "Save <title> to wishlist".
   * `remove`: on the wishlist page, a plain action button "Remove <title> from wishlist" shown in the
   * saved style (no aria-pressed: a pressed toggle named "Remove" would contradict itself).
   */
  action?: 'toggle' | 'remove';
}

/**
 * Toggle with aria-pressed; the name stays "Save <title> to wishlist" and the pressed state carries the
 * change. The visible label stays "Save" too (the filled heart shows the saved state), so the visible text
 * is always part of the accessible name (WCAG 2.5.3).
 */
export function WishlistButton({ pressed, onPressedChange, productTitle, action = 'toggle' }: WishlistButtonProps) {
  if (action === 'remove') {
    return (
      <button type="button" className={styles.button} data-saved="" aria-label={`Remove ${productTitle} from wishlist`} onClick={() => onPressedChange(false)}>
        <Icon name="heart-filled" size="md" />
        <span aria-hidden="true">Remove</span>
      </button>
    );
  }
  return (
    <button type="button" className={styles.button} aria-pressed={pressed} aria-label={`Save ${productTitle} to wishlist`} onClick={() => onPressedChange(!pressed)}>
      <Icon name={pressed ? 'heart-filled' : 'heart'} size="md" />
      <span aria-hidden="true">Save</span>
    </button>
  );
}
