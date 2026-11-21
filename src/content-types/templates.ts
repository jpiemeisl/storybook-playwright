/*
 * Page templates: typed page content per template. Every interface extends PageContent, so `blocks`
 * are allowed everywhere; structured templates render them below their own structured part.
 * All JSON-serializable: no React nodes, functions or Dates (dates are ISO 8601 strings).
 */
import type { Block, PageContent } from './blocks';
import type { BreadcrumbItem } from './navigation';
import type { ActionRef, AuthorRef, ImageRef, LinkRef, RichText } from './shared';

/** Template names understood by the built-in templates registry. */
export type TemplateName =
  | 'default'
  | 'home'
  | 'about'
  | 'services'
  | 'service-detail'
  | 'pricing'
  | 'contact'
  | 'blog-index'
  | 'blog-post'
  | 'case-study-index'
  | 'case-study'
  | 'landing'
  | 'legal'
  | 'search'
  | 'error'
  | 'thank-you';

/** Templates that are just a list of blocks inside the site chrome. */
export const composedTemplates = ['default', 'home', 'about', 'services', 'service-detail', 'pricing', 'contact'] as const;

/** A teaser for an article in listings and "related" sections. */
export interface ArticleSummary {
  /** Unique within the listing. */
  id: string;
  /** Article title. */
  title: string;
  /** Article URL. */
  href: string;
  /** One or two sentences. */
  excerpt?: string;
  /** Card image. */
  image?: ImageRef;
  /** Category label. */
  category?: string;
  /** ISO 8601 date, e.g. "2026-03-14". */
  publishedAt: string;
  /** Reading time in minutes. */
  readingTime?: number;
  /** Author. */
  author?: AuthorRef;
}

/** A category (or filter) link in a listing. */
export interface CategoryLink {
  /** Unique within the list; compared with the listing's active id. */
  id: string;
  /** Visible label. */
  label: string;
  /** Category page URL. */
  href: string;
  /** Number of items, shown after the label. */
  count?: number;
}

/** Which page of a paginated list this is. */
export interface PaginationContent {
  /** 1-based; must be between 1 and totalPages. */
  currentPage: number;
  /** At least 1. */
  totalPages: number;
  /** URL of page 1. Page n links to `${basePath}/page/${n}` (search: `?q=…&page=n`). */
  basePath: string;
}

/** A page heading for templates that have no hero or pageHeader block. */
export interface TemplateHeading {
  /** The page's h1. */
  title: string;
  /** Lead paragraph under the title. */
  description?: string;
  /** Ancestors first; the last item is the current page. */
  breadcrumbs?: BreadcrumbItem[];
}

/** Composed templates (home, about, services, service-detail, pricing, contact, default): blocks only. */
export interface ComposedPage extends PageContent {
  /** One of the composed template names. Omitted means "default". */
  template?: (typeof composedTemplates)[number];
}

/** Blog listing. */
export interface BlogIndexPage extends PageContent {
  /** Template discriminator. */
  template: 'blog-index';
  /** Title and intro. */
  heading: TemplateHeading;
  /** The posts on this page of the listing. */
  listing: {
    /** Posts on this page, newest first. Empty shows the empty state. */
    items: ArticleSummary[];
    /** A post shown large above the grid (usually only on page 1 of "All"). */
    featured?: ArticleSummary;
    /** Category links. Include an "All posts" entry. */
    categories: CategoryLink[];
    /** The category being viewed (marked aria-current="page"). */
    activeCategoryId?: string;
    /** Where the empty state links back to. Default: pagination.basePath. */
    allPostsHref?: string;
    /** Page n of m. */
    pagination: PaginationContent;
  };
}

/** A tag on an article. */
export interface ArticleTag {
  /** Visible label. */
  label: string;
  /** Tag page URL. */
  href?: string;
}

/** An author with a bio, for the "About the author" block. */
export interface ArticleAuthor extends AuthorRef {
  /** Short bio, plain text. */
  bio?: string;
}

/** Blog post. */
export interface BlogPostPage extends PageContent {
  /** Template discriminator. */
  template: 'blog-post';
  /** The article. */
  article: {
    /** The page's h1. */
    title: string;
    /** Lead paragraph. */
    excerpt?: string;
    /** Author (name required). */
    author: ArticleAuthor;
    /** ISO 8601 date. */
    publishedAt: string;
    /** Reading time in minutes. */
    readingTime?: number;
    /** Tags. */
    tags?: ArticleTag[];
    /** Large image under the header. */
    heroImage?: ImageRef;
    /** Ancestors first; the last item is this post. */
    breadcrumbs?: BreadcrumbItem[];
    /** Absolute URL for the share links. Share links are omitted without it. */
    shareUrl?: string;
    /** The body. richText blocks form the prose; their h2/h3 headings build the table of contents (3 or more). */
    body: Block[];
    /** Up to four related posts. */
    related?: ArticleSummary[];
  };
}

/** A case study teaser in the case study index. */
export interface CaseStudySummary {
  /** Unique within the listing. */
  id: string;
  /** Case study title. */
  title: string;
  /** Case study URL. */
  href: string;
  /** Client name, shown above the title. */
  client: string;
  /** One or two sentences. */
  summary?: string;
  /** Card image. */
  image?: ImageRef;
  /** Headline result, e.g. "Books closed in 5 days, down from 25". */
  keyResult?: string;
}

/** Case study listing. */
export interface CaseStudyIndexPage extends PageContent {
  /** Template discriminator. */
  template: 'case-study-index';
  /** Title and intro. */
  heading: TemplateHeading;
  /** The case studies on this page. */
  listing: {
    /** Case studies on this page. Empty shows the empty state. */
    items: CaseStudySummary[];
    /** Filter links (by industry or service). Include an "All" entry. */
    filters?: CategoryLink[];
    /** Accessible name of the filter nav. Default "Filter by industry". */
    filterLabel?: string;
    /** The filter being viewed. */
    activeFilterId?: string;
    /** Where the empty state links back to. Default: pagination.basePath. */
    allHref?: string;
    /** Page n of m. */
    pagination: PaginationContent;
  };
}

/** A single case study. */
export interface CaseStudyPage extends PageContent {
  /** Template discriminator. */
  template: 'case-study';
  /** The case study. */
  caseStudy: {
    /** The page's h1. */
    title: string;
    /** Lead paragraph. */
    summary?: string;
    /** Client name. */
    client: string;
    /** Client's industry. */
    industry?: string;
    /** Services delivered. */
    services?: string[];
    /** Ancestors first; the last item is this case study. */
    breadcrumbs?: BreadcrumbItem[];
    /** Large image under the header. */
    heroImage?: ImageRef;
    /** Key results, shown as stats. 2-4 work best. */
    results?: { value: string; label: string; description?: string }[];
    /** Body blocks (richText, gallery, testimonial…), rendered as page sections. */
    body: Block[];
    /** The previous case study. */
    previous?: LinkRef;
    /** The next case study. */
    next?: LinkRef;
  };
}

/** Legal page (privacy policy, terms). */
export interface LegalPage extends PageContent {
  /** Template discriminator. */
  template: 'legal';
  /** The document. */
  legal: {
    /** The page's h1. */
    title: string;
    /** Lead paragraph. */
    intro?: string;
    /** ISO 8601 date, shown as "Last updated". */
    lastUpdated: string;
    /** Ancestors first. */
    breadcrumbs?: BreadcrumbItem[];
    /** The text. Its h2/h3 headings build the table of contents (3 or more). */
    body: RichText;
  };
}

/** One search result. */
export interface SearchResult {
  /** Unique within the results. */
  id: string;
  /** Result title (the link text). */
  title: string;
  /** Result URL. */
  url: string;
  /** Matching text. Plain text. */
  excerpt?: string;
  /** Content type, shown as a badge, e.g. "Article". */
  type?: string;
  /** Where the result lives, e.g. Home › Services. */
  trail?: BreadcrumbItem[];
}

/** Search results. Results come in as data; the template does not search. */
export interface SearchPage extends PageContent {
  /** Template discriminator. */
  template: 'search';
  /** The query and its results. */
  search: {
    /** The query as typed. Empty: the "Enter a search term" state. */
    query: string;
    /** Total number of results across all pages. */
    total: number;
    /** Results on this page (up to 10). */
    results: SearchResult[];
    /** Page n of m. basePath is the search page URL (e.g. "/search"). */
    pagination: PaginationContent;
    /** Where the search form submits (GET, field "q"). Default: pagination.basePath. */
    action?: string;
    /** Suggestions shown when there are no results. */
    suggestions?: string[];
    /** Shown with the suggestions: "Still stuck? Contact us". */
    contactLink?: LinkRef;
  };
}

/** Error page (404, 500, 503). */
export interface ErrorPageContent extends PageContent {
  /** Template discriminator. */
  template: 'error';
  /** The error. */
  error: {
    /** HTTP status shown above the title. */
    code: 404 | 500 | 503;
    /** The page's h1. */
    title: string;
    /** What happened and what to do. Plain text. */
    message: string;
    /** Main way forward. */
    primaryAction: ActionRef;
    /** Second way forward. */
    secondaryAction?: ActionRef;
    /** Suggested pages. */
    links?: LinkRef[];
    /** Show a search form (GET, field "q") that submits here, e.g. "/search". */
    searchAction?: string;
    /** Site chrome: "minimal" (logo only) suits 500/503 when navigation may be broken. Default "default". */
    layout?: 'default' | 'minimal';
  };
}

/** Confirmation after a form or purchase. */
export interface ThankYouPage extends PageContent {
  /** Template discriminator. */
  template: 'thank-you';
  /** The confirmation. */
  thankYou: {
    /** The page's h1. */
    title: string;
    /** Confirmation message. Plain text. */
    message: string;
    /** "What happens next" steps. */
    steps?: { title: string; description?: string }[];
    /** Up to two actions. */
    actions?: ActionRef[];
    /** Related links. */
    links?: LinkRef[];
  };
}

/** Landing page: minimal chrome, blocks only. */
export interface LandingPage extends PageContent {
  /** Template discriminator. */
  template: 'landing';
  /** Call to action pinned to the bottom of the screen on narrow screens. */
  stickyCta?: ActionRef;
  /** Short line beside the sticky call to action. */
  stickyCtaMessage?: string;
}

/** Every built-in template page shape. */
export type TemplatePage =
  | ComposedPage
  | BlogIndexPage
  | BlogPostPage
  | CaseStudyIndexPage
  | CaseStudyPage
  | LegalPage
  | SearchPage
  | ErrorPageContent
  | ThankYouPage
  | LandingPage;
