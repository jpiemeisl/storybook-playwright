/*
 * JSON-serializable content model: what a CMS adapter produces. No React nodes, functions or Dates.
 * (Prop-facing shapes that may contain React nodes live in src/component-types.)
 */
export type { Money } from './money';
export type { BreadcrumbItem, NavItem, SocialLink } from './navigation';
export type { ActionRef, AuthorRef, ImageRef, LinkRef, RichText, SeoMeta } from './shared';
export type * from './blocks';
export { blockTypes } from './blocks';
export type { AnnouncementContent, FooterContent, HeaderContent, LogoContent, SiteChrome } from './chrome';
export type { IsJson } from './json';
