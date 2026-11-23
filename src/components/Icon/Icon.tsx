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
  plus: <path d="M12 6v12M6 12h12" />,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  play: <path d="M7 5v14l12-7z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  'map-pin': (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  quote: <path d="M5 11h4v7H4v-5c0-3 1.5-5 4-6M15 11h4v7h-5v-5c0-3 1.5-5 4-6" />,
  expand: <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />,
  share: (
    <>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9z" />
      <circle cx="8" cy="8" r="1.5" />
    </>
  ),
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
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor" />,
  'star-half': (
    <>
      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
      <path d="M12 3L9.3 8.6l-6.1.9 4.4 4.3-1 6.1L12 17z" fill="currentColor" />
    </>
  ),
  'star-empty': <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  'heart-filled': <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="currentColor" />,
  filter: <path d="M4 5h16l-6 7.5V19l-4-2v-4.5z" />,
  sort: <path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" />,
  truck: (
    <>
      <path d="M2 6h11v10H2zM13 9h4l4 4v3h-8" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  refresh: <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4" />,
  shield: <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" />,
  ruler: <path d="M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  repeat: <path d="M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4" />,
  cart: (
    <>
      <path d="M3 4h2l2.4 11h11l2-8H6.3" />
      <circle cx="9" cy="19.5" r="1.5" />
      <circle cx="17" cy="19.5" r="1.5" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </>
  ),
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  'credit-card': (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7a2 2 0 0 1 2-2h11v4" />
      <rect x="4" y="7" width="16" height="13" rx="2" />
      <path d="M16 13.5h2" />
    </>
  ),
  package: (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9M8 5.3l8 4.4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  'log-out': <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off': <path d="M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17.3 17.3 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2" />,
  receipt: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6M9 16h3" />,
  'file-text': <path d="M14 3H6v18h12V7l-4-4zM14 3v4h4M9 13h6M9 17h6M9 9h2" />,
  pencil: <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />,
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

/** Names of the social-network icons (simplified glyphs, not official brand marks), e.g. for ShareLinks or a footer. */
export const socialIconNames = ['facebook', 'instagram', 'linkedin', 'x', 'youtube', 'github'] as const;
/** Name of one of the social-network icons. */
export type SocialIconName = (typeof socialIconNames)[number];

/** Name of any icon in the library's set. */
export type IconName = keyof typeof paths;
/** Rendered size of an Icon. */
export type IconSize = 'sm' | 'md' | 'lg' | 'xl';
/** Every available icon name, in definition order. Useful for pickers and Storybook controls. */
export const iconNames = Object.keys(paths) as IconName[];

/** Props for Icon. Accepts SVG attributes except `children`. */
export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
  /** Which icon to draw. */
  name: IconName;
  /** Rendered size. */
  size?: IconSize;
  /** Accessible name. Omit for decorative icons, which are then hidden from assistive tech. */
  title?: string;
}

/**
 * An inline 24x24 SVG icon from the library's set, drawn in `currentColor` so it matches the surrounding text.
 *
 * Decorative by default (aria-hidden). Pass `title` to give it role="img" and an accessible name.
 */
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
