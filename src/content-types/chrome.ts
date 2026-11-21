/*
 * Site-wide chrome (header, footer, announcement): serializable versions of the navigation props.
 * Used by page templates (Phase 8).
 */
import type { NavItem, SocialLink } from './navigation';
import type { ImageRef, LinkRef } from './shared';

/** The site logo. */
export interface LogoContent {
  /** Text wordmark; also the accessible name of the logo link. */
  text: string;
  /** Logo link, usually "/". */
  href: string;
  /** Optional logo image (alt should be "" when `text` is shown beside it). */
  image?: ImageRef;
}

/** Site header. */
export interface HeaderContent {
  /** Logo. */
  logo: LogoContent;
  /** Main navigation; one level of children. */
  items: NavItem[];
  /** Header call to action. */
  cta?: LinkRef;
  /** Stick to the top while scrolling. */
  sticky?: boolean;
}

/** Site footer. */
export interface FooterContent {
  /** Logo. */
  logo?: LogoContent;
  /** Link columns. 1-4 columns. */
  columns: { heading: string; items: NavItem[] }[];
  /** Social profile links. */
  social?: SocialLink[];
  /** Copyright line and legal links. */
  legal: { copyright: string; links: LinkRef[] };
  /** Show a newsletter sign-up in the footer. */
  newsletter?: { heading?: string; consentLabel?: string };
}

/** A site-wide message bar. */
export interface AnnouncementContent {
  /** The message, plain text. Guidance: under 120 characters. */
  message: string;
  /** Optional link after the message. */
  link?: LinkRef;
  /** Default "info". */
  tone?: 'info' | 'success' | 'warning';
}

/** Header, footer and optional announcement for every page. */
export interface SiteChrome {
  /** Header. */
  header: HeaderContent;
  /** Footer. */
  footer: FooterContent;
  /** Optional announcement bar. */
  announcement?: AnnouncementContent;
}
