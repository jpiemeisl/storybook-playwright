/*
 * SiteChrome (serializable) → component props for Header, Footer and AnnouncementBar. Pure. Links go
 * through the same rules as block links: unsafe targets (javascript:, data:…) are refused and reported.
 */
import type { FooterColumn } from '../components/Footer';
import type { LinkListItem } from '../components/LinkList';
import type { MenuCta } from '../components/MobileMenu';
import type { SiteLogoProps } from '../components/SiteLogo';
import type { AnnouncementBarProps } from '../components/AnnouncementBar';
import type { LogoContent, SiteChrome } from '../content-types/chrome';
import type { NavItem, SocialLink } from '../content-types/navigation';
import type { LinkRef } from '../content-types/shared';
import type { ValidationIssue } from '../registry/checker';
import { isSafeHref, isSafeImageSrc } from '../registry/links';
import { markCurrent, type PathMatch } from './currentPath';

/** Header, Footer and AnnouncementBar props produced by chromeToProps, with unsafe links and images already removed. */
export interface ChromeProps {
  header: { logo: SiteLogoProps; items: NavItem[]; cta?: MenuCta; sticky: boolean };
  footer: {
    logo?: SiteLogoProps;
    columns: FooterColumn[];
    social: SocialLink[];
    legal: { copyright: string; links: LinkListItem[] };
    newsletter?: { heading?: string; consentLabel?: string };
  };
  announcement?: Pick<AnnouncementBarProps, 'message' | 'link' | 'tone' | 'dismissible'>;
}

/** Options for chromeToProps: current-path marking and a callback for refused links and images. */
export interface ChromeOptions {
  /** Marks the matching header item (prefix mode by default) and footer link (exact) with aria-current. */
  currentPath?: string;
  /** How header items match currentPath. Default "prefix". */
  match?: PathMatch;
  /** Called for each refused link or image. */
  onIssue?: (issue: ValidationIssue) => void;
}

/** Converts site chrome content to Header, Footer and AnnouncementBar props. */
export function chromeToProps(chrome: SiteChrome, options: ChromeOptions = {}): ChromeProps {
  const report = (path: string, value: unknown, what = 'Link target') =>
    options.onIssue?.({ code: what === 'Link target' ? 'unsafe-href' : 'unsafe-src', severity: 'error', message: `${what} ${JSON.stringify(value)} in the site chrome was refused.`, path });

  const logo = (content: LogoContent, path: string): SiteLogoProps => {
    const href = isSafeHref(content.href) ? content.href : (report(`${path}.href`, content.href), '/');
    const image = content.image && (isSafeImageSrc(content.image.src) ? content.image : (report(`${path}.image.src`, content.image.src, 'Image source'), undefined));
    return { text: content.text, href, ...(image ? { image: { src: image.src, alt: '', width: image.width, height: image.height } } : {}) };
  };

  const navItems = (items: NavItem[], path: string): NavItem[] =>
    items.flatMap((item, i) => {
      if (!isSafeHref(item.href)) {
        report(`${path}[${i}].href`, item.href);
        return [];
      }
      const { children, ...rest } = item;
      return [{ ...rest, ...(children?.length ? { children: navItems(children, `${path}[${i}].children`) } : {}) }];
    });

  const link = (ref: LinkRef | undefined, path: string) => {
    if (!ref) return undefined;
    if (isSafeHref(ref.href)) return { label: ref.label, href: ref.href, ...(ref.ariaLabel ? { ariaLabel: ref.ariaLabel } : {}) };
    report(`${path}.href`, ref.href);
    return undefined;
  };

  const { header, footer, announcement } = chrome;
  const columns = footer.columns.map((column, c) => ({
    heading: column.heading,
    items: markCurrent(navItems(column.items, `footer.columns[${c}].items`), options.currentPath, 'exact'),
  }));
  const social = (footer.social ?? []).filter((item, i) => isSafeHref(item.href) || (report(`footer.social[${i}].href`, item.href), false));
  const cta = link(header.cta, 'header.cta');
  const announcementLink = link(announcement?.link, 'announcement.link');

  return {
    header: {
      logo: logo(header.logo, 'header.logo'),
      items: markCurrent(navItems(header.items, 'header.items'), options.currentPath, options.match ?? 'prefix'),
      ...(cta ? { cta: { label: cta.label, href: cta.href } } : {}),
      sticky: header.sticky ?? false,
    },
    footer: {
      ...(footer.logo ? { logo: logo(footer.logo, 'footer.logo') } : {}),
      columns,
      social,
      legal: {
        copyright: footer.legal.copyright,
        links: footer.legal.links.flatMap((item, i) => link(item, `footer.legal.links[${i}]`) ?? []),
      },
      ...(footer.newsletter ? { newsletter: footer.newsletter } : {}),
    },
    ...(announcement
      ? {
          announcement: {
            message: announcement.message,
            tone: announcement.tone ?? 'accent',
            dismissible: announcement.dismissible ?? false,
            ...(announcementLink ? { link: { label: announcementLink.label, href: announcementLink.href } } : {}),
          },
        }
      : {}),
  };
}
