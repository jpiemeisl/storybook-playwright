/*
 * Plain data shapes for navigation components. A CMS or router adapter maps its own data
 * into these; components never know where the data came from.
 */
import type { SocialIconName } from '../components/Icon';

/** A navigation link for Header, MobileMenu and Footer columns, with optional children and a current-page flag. */
export interface NavItem {
  label: string;
  href: string;
  /** One level of children is rendered (dropdown on desktop, accordion on mobile). */
  children?: NavItem[];
  /** The page being viewed. Rendered with aria-current="page". */
  current?: boolean;
}

/** An icon-only link to a social profile (Footer, TeamMember), with the platform that picks the icon and an accessible label. */
export interface SocialLink {
  platform: SocialIconName;
  href: string;
  /** Accessible name for the icon-only link, e.g. "Follow us on LinkedIn". */
  label: string;
}

/** One step in a Breadcrumbs trail. */
export interface BreadcrumbItem {
  label: string;
  /** Omit for the current page (the last item). */
  href?: string;
}
