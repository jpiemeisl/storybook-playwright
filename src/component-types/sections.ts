/*
 * Plain data shapes for content sections. A CMS adapter maps its own data into these; components
 * never know where the data came from. Rich text is a ReactNode until the Prose component exists.
 */
import type { ReactNode } from 'react';
import type { IconName } from '../components/Icon';
import type { ImageProps } from '../components/Image';
import type { Money } from '../content-types/money';

/** The parts of an Image a content editor supplies. */
export type ImageContent = Pick<ImageProps, 'src' | 'alt' | 'width' | 'height' | 'srcSet' | 'sizes'>;

/** A resolved link (label and href) for buttons and links in components such as Hero, CtaBanner and PricingTable. */
export interface ActionLink {
  label: string;
  href: string;
}

/** Content for the Hero component: headline, optional subhead, up to two actions and media. */
export interface HeroContent {
  headline: string;
  subhead?: ReactNode;
  primaryAction?: ActionLink;
  secondaryAction?: ActionLink;
  media?: ImageContent;
}

/** One item in a FeatureGrid: optional icon, title, description and link. */
export interface FeatureItem {
  icon?: IconName;
  title: string;
  description?: ReactNode;
  href?: string;
}

/** Content for a Card: title, optional link, description, eyebrow and image. */
export interface CardContent {
  title: string;
  href?: string;
  description?: ReactNode;
  /** Short label above the title, e.g. a category; pass a Badge for a pill. */
  eyebrow?: ReactNode;
  image?: ImageContent;
}

/** An article author shown on an ArticleCard: name and optional avatar. */
export interface Author {
  name: string;
  avatar?: ImageContent;
}

/** Content for an ArticleCard (also used by RelatedPosts): title, link, publish date and optional excerpt, category, reading time, author and image. */
export interface ArticleCardContent {
  title: string;
  href: string;
  excerpt?: ReactNode;
  category?: string;
  /** ISO 8601 date, e.g. "2026-03-14". */
  publishedAt: string;
  readingTimeMinutes?: number;
  author?: Author;
  image?: ImageContent;
}

/** Text content for MediaText (the media is passed separately): optional eyebrow, heading, body and actions. */
export interface MediaTextContent {
  eyebrow?: string;
  heading: string;
  body?: ReactNode;
  actions?: ActionLink[];
}

/** Content for a CtaBanner: heading, optional body, a required primary action and an optional secondary one. */
export interface CtaContent {
  heading: string;
  body?: ReactNode;
  primaryAction: ActionLink;
  secondaryAction?: ActionLink;
}

/** One figure in Stats: a preformatted value, its label and an optional description. */
export interface StatItem {
  /** Already formatted, e.g. "1,200+" or "98%". */
  value: string;
  label: string;
  description?: string;
}

/** Content for a Testimonial: the quote, its author (name, role, company, avatar) and an optional company logo. */
export interface TestimonialContent {
  quote: ReactNode;
  author: {
    name: string;
    role?: string;
    company?: string;
    avatar?: ImageContent;
  };
  companyLogo?: ImageContent;
}

/** One logo in a LogoStrip: company name (used as alt text), image and optional link. */
export interface LogoItem {
  /** Company name; used as the image's alt text. */
  name: string;
  image: Omit<ImageContent, 'alt'>;
  /** Optional link to a case study or the company. */
  href?: string;
}

/** One question and answer in a FaqSection; `id` must be unique within the list. */
export interface FaqItem {
  id: string;
  question: string;
  answer: ReactNode;
}

/** Billing period of a PricingTier price; PricingTable shows it after the price ("month", "year" or "one-time"). */
export type BillingInterval = 'month' | 'year' | 'one-time';

/** One line in a pricing tier feature list, marked as included or not. */
export interface PricingFeature {
  label: string;
  included: boolean;
}

/** One plan in a PricingTable: name, price (or custom), billing interval, optional annual price, features, call to action and highlight. */
export interface PricingTier {
  id: string;
  name: string;
  description?: string;
  /** null renders "Custom". */
  price: Money | null;
  interval?: BillingInterval;
  /** Price shown when the annual billing period is selected. Its interval is "year". */
  annualPrice?: Money | null;
  features: PricingFeature[];
  cta: ActionLink;
  highlighted?: boolean;
  /** Text badge, e.g. "Most popular". Highlighted tiers without one get "Recommended". */
  badge?: string;
}
