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
  minus: <path d="M6 12h12" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8v.01" />
    </>
  ),
  'alert-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5M12 16v.01" />
    </>
  ),
  'alert-triangle': <path d="M12 3.5 2.5 20h19zM12 10v4.5M12 17.5v.01" />,
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.7 2.7L16.5 9.5" />
    </>
  ),

  /* Social: simplified glyphs, not official brand marks. */
  facebook: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M15.5 8H14a2 2 0 0 0-2 2v11M9 13h6" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10.5V17M8 7.5v.01M12 17v-6.5M12 13.5a2.5 2.5 0 0 1 5 0V17" />
    </>
  ),
  x: <path d="M4 4h4.5L20 20h-4.5zM19.5 4l-6.6 7.6M4.5 20l6.6-7.6" />,
  youtube: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="M10 9l5 3-5 3z" fill="currentColor" />
    </>
  ),
  github: (
    <path d="M9 20v-2.6a2.6 2.6 0 0 1 .7-1.9C6.8 15.2 5 13.9 5 10.8c0-1.1.4-2.1 1.1-2.9-.2-.8-.2-1.8.2-2.6 0 0 .9 0 2.6 1.1a9.4 9.4 0 0 1 6.2 0c1.7-1.1 2.6-1.1 2.6-1.1.4.8.4 1.8.2 2.6.7.8 1.1 1.8 1.1 2.9 0 3.1-1.8 4.4-4.7 4.7a2.6 2.6 0 0 1 .7 1.9V20M9 18c-2.6.6-3.2-1-4.2-1.6" />
  ),
} satisfies Record<string, ReactNode>;

export const socialIconNames = ['facebook', 'instagram', 'linkedin', 'x', 'youtube', 'github'] as const;
export type SocialIconName = (typeof socialIconNames)[number];

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
