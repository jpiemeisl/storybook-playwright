import { useId, type ReactNode, type SVGAttributes } from 'react';
import styles from './Icon.module.css';

/* 24×24 stroke icons drawn for this library. Stroke and fill inherit currentColor. */
const paths = {
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  'arrow-left': <path d="M19 12H5M11 6l-6 6 6 6" />,
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  phone: (
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  check: <path d="M5 12l5 5 9-10" />,
  'external-link': <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;
export type IconSize = 'sm' | 'md' | 'lg' | 'xl';
export const iconNames = Object.keys(paths) as IconName[];

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
  name: IconName;
  size?: IconSize;
  /** Accessible name. Omit for decorative icons, which are then hidden from assistive tech. */
  title?: string;
}

export function Icon({ name, size = 'md', title, className, ...rest }: IconProps) {
  const titleId = useId();
  const classes = [styles.icon, styles[size], className].filter(Boolean).join(' ');
  const a11y = title ? { role: 'img', 'aria-labelledby': titleId } : { 'aria-hidden': true };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      className={classes}
      {...a11y}
      {...rest}
    >
      {title && <title id={titleId}>{title}</title>}
      {paths[name]}
    </svg>
  );
}
