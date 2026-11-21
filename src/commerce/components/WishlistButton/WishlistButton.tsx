import { Icon } from '../../../components/Icon';
import styles from './WishlistButton.module.css';

export interface WishlistButtonProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  productTitle: string;
}

/** Toggle with aria-pressed; the name stays "Save <title> to wishlist" and the pressed state carries the change. */
export function WishlistButton({ pressed, onPressedChange, productTitle }: WishlistButtonProps) {
  return (
    <button type="button" className={styles.button} aria-pressed={pressed} aria-label={`Save ${productTitle} to wishlist`} onClick={() => onPressedChange(!pressed)}>
      <Icon name={pressed ? 'heart-filled' : 'heart'} size="md" />
      <span aria-hidden="true">{pressed ? 'Saved' : 'Save'}</span>
    </button>
  );
}
