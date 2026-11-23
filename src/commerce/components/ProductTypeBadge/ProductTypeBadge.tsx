import { Badge } from '../../../components/Badge';
import { Icon, type IconName } from '../../../components/Icon';
import type { ProductKind } from '../../types/product';
import styles from './ProductTypeBadge.module.css';

/** Props for ProductTypeBadge. */
export interface ProductTypeBadgeProps {
  kind: ProductKind;
  /** Also label physical products ("Physical product"). Default false: physical renders nothing. */
  showPhysical?: boolean;
  size?: 'sm' | 'md';
}

const meta: Record<ProductKind, { text: string; icon: IconName }> = {
  digital: { text: 'Digital download', icon: 'download' },
  subscription: { text: 'Subscription', icon: 'repeat' },
  physical: { text: 'Physical product', icon: 'tag' },
};

/** Labels digital and subscription products so the delivery model is clear before checkout. */
export function ProductTypeBadge({ kind, showPhysical = false, size = 'md' }: ProductTypeBadgeProps) {
  if (kind === 'physical' && !showPhysical) return null;
  const { text, icon } = meta[kind];
  return (
    <Badge tone={kind === 'physical' ? 'neutral' : 'accent'} size={size}>
      <Icon name={icon} size="sm" className={styles.icon} />
      {text}
    </Badge>
  );
}
