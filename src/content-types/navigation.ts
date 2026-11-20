/*
 * Plain data shapes for navigation components. A CMS or router adapter maps its own data
 * into these; components never know where the data came from.
 */
import type { SocialIconName } from '../components/Icon';

export interface NavItem {
  label: string;
  href: string;
  /** One level of children is rendered (dropdown on desktop, accordion on mobile). */
  children?: NavItem[];
  /** The page being viewed. Rendered with aria-current="page". */
  current?: boolean;
}

export interface SocialLink {
  platform: SocialIconName;
  href: string;
  /** Accessible name for the icon-only link, e.g. "Follow us on LinkedIn". */
  label: string;
}

export interface BreadcrumbItem {
  label: string;
  /** Omit for the current page (the last item). */
  href?: string;
}
