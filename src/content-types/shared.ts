/*
 * Shared reference types used by every block. All JSON-serializable: no React nodes, functions,
 * class instances or Date objects. Dates are ISO 8601 strings; prices use Money (minor units).
 */

/** An image. */
export interface ImageRef {
  /** Image URL (relative path or http(s)). Never a data: URL. */
  src: string;
  /** Alternative text. Required; use "" only for purely decorative images. Guidance: under 150 characters. */
  alt: string;
  /** Intrinsic width in pixels; with height, lets the browser reserve space. */
  width?: number;
  /** Intrinsic height in pixels. */
  height?: number;
  /** Responsive sources, HTML srcset syntax. */
  srcSet?: string;
  /** HTML sizes attribute for srcSet. */
  sizes?: string;
  /** Point to keep in view when cropping, as fractions 0-1 from the top-left. */
  focalPoint?: { x: number; y: number };
}

/** A link. */
export interface LinkRef {
  /** Visible link text. Guidance: under 60 characters. */
  label: string;
  /** Relative path, #fragment, or an http(s), mailto: or tel: URL. javascript: and data: are refused. */
  href: string;
  /** Force external treatment (new-window safe rel, external icon). Defaults to true for absolute http(s) URLs. */
  external?: boolean;
  /** Accessible name when the visible label is not descriptive enough on its own. */
  ariaLabel?: string;
}

/** A link styled as a button. */
export interface ActionRef extends LinkRef {
  /** Visual emphasis. Defaults depend on position (first action primary, second secondary). */
  variant?: 'primary' | 'secondary' | 'ghost';
}

/**
 * Formatted text. Only HTML is implemented today; the union leaves room for other formats.
 *
 * WARNING: THIS LIBRARY DOES NOT SANITIZE HTML. `html` is inserted into the page as-is. The adapter
 * (or host app) MUST sanitize it with an allow-list of tags and attributes BEFORE producing a
 * RichText value. The renderer only neutralizes unsafe URLs (javascript:, data: and similar link and
 * image targets); it does not remove scripts, event handler attributes, styles or iframes.
 */
export type RichText = {
  /** Format discriminator. */
  format: 'html';
  /** Sanitized HTML using only: p, h2-h4, strong, em, a, ul, ol, li, blockquote, code, pre, br, hr, table elements, figure, img. */
  html: string;
};

/** Page metadata for <head>. */
export interface SeoMeta {
  /** Document title. Guidance: under 60 characters. */
  title: string;
  /** Meta description. Guidance: 120-160 characters. */
  description?: string;
  /** Absolute canonical URL. */
  canonicalUrl?: string;
  /** Ask search engines not to index the page. */
  noindex?: boolean;
  /** Social sharing image. */
  ogImage?: ImageRef;
}

/** A person credited on content. */
export interface AuthorRef {
  /** Full name. */
  name: string;
  /** Job title. */
  role?: string;
  /** Portrait. Initials are shown when missing. */
  avatar?: ImageRef;
  /** Author profile page. */
  href?: string;
}
