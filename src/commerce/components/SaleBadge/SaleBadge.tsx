import styles from './SaleBadge.module.css';

/** Props for SaleBadge; pass `percent` for "Save N%" or `label` for custom text (`label` wins when both are set). */
export interface SaleBadgeProps {
  /** Whole percent off: "Save 20%". */
  percent?: number;
  /** Custom text instead, e.g. "Sale" or "2 for $30". */
  label?: string;
  size?: 'sm' | 'md';
}

/** Sale marker with text (never colour alone). Renders nothing without a percent above 0 or a label. */
export function SaleBadge({ percent, label, size = 'md' }: SaleBadgeProps) {
  const text = label ?? (percent && percent > 0 ? `Save ${percent}%` : '');
  if (!text) return null;
  return <span className={[styles.badge, styles[size]].join(' ')}>{text}</span>;
}
