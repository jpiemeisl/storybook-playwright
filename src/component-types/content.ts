/*
 * Plain data shapes for page, article and media components. CMS adapters map into these.
 */
import type { ReactNode } from 'react';
import type { ImageContent } from './sections';
import type { SocialLink } from '../content-types/navigation';

/** Content for a PageHeader: page title and optional description. */
export interface PageHeaderContent {
  title: string;
  description?: ReactNode;
}

/** Content for an AuthorByline: name and optional role, avatar, profile link and bio. */
export interface AuthorContent {
  name: string;
  role?: string;
  avatar?: ImageContent;
  href?: string;
  /** Short bio, shown by the "block" byline variant. */
  bio?: ReactNode;
}

export interface TagItem {
  label: string;
  href?: string;
  count?: number;
}

/** A category for CategoryFilter: a TagItem with a required id. */
export interface CategoryItem extends TagItem {
  id: string;
}

/** One entry in a TableOfContents: the target heading id, label and level (2 or 3). */
export interface TocItem {
  /** id of the heading element on the page. */
  id: string;
  label: string;
  level: 2 | 3;
}

/** One image in a Gallery (and its Lightbox): src, alt, width and height are required; caption is optional. */
export interface GalleryImage extends Required<Pick<ImageContent, 'src' | 'alt' | 'width' | 'height'>> {
  caption?: ReactNode;
}

/** Content for a TeamMember: name and optional role, photo, bio and social links. */
export interface TeamMemberContent {
  name: string;
  role?: string;
  photo?: ImageContent;
  bio?: ReactNode;
  social?: SocialLink[];
}

/** One entry in a Timeline: a date or phase label, title and optional description. */
export interface TimelineItem {
  /** Date or phase, e.g. "2019" or "Phase 2". */
  label: string;
  title: string;
  description?: ReactNode;
}

/** One step in a Steps list: title and optional description. */
export interface StepItem {
  title: string;
  description?: ReactNode;
}

/** A Table column: the row key it shows, its header, and numeric or alignment options. */
export interface TableColumn<Row> {
  key: keyof Row & string;
  header: ReactNode;
  /** Right-aligns with tabular numerals. */
  numeric?: boolean;
  align?: 'start' | 'center' | 'end';
}

/**
 * Columns and rows for a Table, kept together as one value, so a host app can store or pass a whole
 * table and spread it into `<Table caption="…" {...data} />`. No core component takes it as a prop.
 * Not the same as the commerce `TableData` (a JSON size-guide table from
 * `@jpiemeisl/pattern-library/commerce`); this one is generic over the row shape and its cells may be
 * React nodes.
 */
export interface TableData<Row extends Record<string, ReactNode>> {
  columns: TableColumn<Row>[];
  rows: Row[];
}

/** Where a VideoEmbed video is hosted: YouTube or Vimeo (embedded by `videoId`) or `generic` (embedded from a full `src` URL). */
export type VideoProvider = 'youtube' | 'vimeo' | 'generic';

/** Content for a click-to-load VideoEmbed: provider, video id or embed URL, title and optional local poster. */
export interface VideoContent {
  provider: VideoProvider;
  /** YouTube or Vimeo id. */
  videoId?: string;
  /** Full embed URL for `generic`. */
  src?: string;
  title: string;
  /** Local poster image. Never fetched from the provider. */
  poster?: ImageContent;
}

/** Content for a click-to-load MapEmbed: embed URL, title, address and a directions link. */
export interface MapContent {
  /** Embed URL (only loaded after the user asks for the map). */
  src: string;
  title: string;
  address: string;
  directionsHref: string;
}

/** A network ShareLinks can offer a share link for. */
export type ShareNetwork = 'x' | 'linkedin' | 'facebook' | 'email';
