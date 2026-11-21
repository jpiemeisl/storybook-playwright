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

export interface ActionLink {
  label: string;
  href: string;
}

export interface HeroContent {
  headline: string;
  subhead?: ReactNode;
  primaryAction?: ActionLink;
  secondaryAction?: ActionLink;
  media?: ImageContent;
}

export interface FeatureItem {
  icon?: IconName;
  title: string;
  description?: ReactNode;
  href?: string;
}

export interface CardContent {
  title: string;
  href?: string;
  description?: ReactNode;
  /** Short label above the title, e.g. a category; pass a Badge for a pill. */
  eyebrow?: ReactNode;
  image?: ImageContent;
}

export interface Author {
  name: string;
  avatar?: ImageContent;
}

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

export interface MediaTextContent {
  eyebrow?: string;
  heading: string;
  body?: ReactNode;
  actions?: ActionLink[];
}

export interface CtaContent {
  heading: string;
  body?: ReactNode;
  primaryAction: ActionLink;
  secondaryAction?: ActionLink;
}

export interface StatItem {
  /** Already formatted, e.g. "1,200+" or "98%". */
  value: string;
  label: string;
  description?: string;
}

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

export interface LogoItem {
  /** Company name; used as the image's alt text. */
  name: string;
  image: Omit<ImageContent, 'alt'>;
  /** Optional link to a case study or the company. */
  href?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: ReactNode;
}

export type BillingInterval = 'month' | 'year' | 'one-time';

export interface PricingFeature {
  label: string;
  included: boolean;
}

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
