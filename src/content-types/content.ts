/*
 * Plain data shapes for page, article and media components. CMS adapters map into these.
 */
import type { ReactNode } from 'react';
import type { ImageContent } from './sections';
import type { SocialLink } from './navigation';

export interface PageHeaderContent {
  title: string;
  description?: ReactNode;
}

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

export interface CategoryItem extends TagItem {
  id: string;
}

export interface TocItem {
  /** id of the heading element on the page. */
  id: string;
  label: string;
  level: 2 | 3;
}

export interface GalleryImage extends Required<Pick<ImageContent, 'src' | 'alt' | 'width' | 'height'>> {
  caption?: ReactNode;
}

export interface TeamMemberContent {
  name: string;
  role?: string;
  photo?: ImageContent;
  bio?: ReactNode;
  social?: SocialLink[];
}

export interface TimelineItem {
  /** Date or phase, e.g. "2019" or "Phase 2". */
  label: string;
  title: string;
  description?: ReactNode;
}

export interface StepItem {
  title: string;
  description?: ReactNode;
}

export interface TableColumn<Row> {
  key: keyof Row & string;
  header: ReactNode;
  /** Right-aligns with tabular numerals. */
  numeric?: boolean;
  align?: 'start' | 'center' | 'end';
}

export interface TableData<Row extends Record<string, ReactNode>> {
  columns: TableColumn<Row>[];
  rows: Row[];
}

export type VideoProvider = 'youtube' | 'vimeo' | 'generic';

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

export interface MapContent {
  /** Embed URL (only loaded after the user asks for the map). */
  src: string;
  title: string;
  address: string;
  directionsHref: string;
}

export type ShareNetwork = 'x' | 'linkedin' | 'facebook' | 'email';
