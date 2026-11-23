/*
 * The block model: what a CMS adapter produces. JSON-serializable only.
 *
 * Doc format (read by scripts/content-model-docs.mjs): every interface and field has a JSDoc
 * comment on the line(s) above it; field types fit on one line.
 */
import type { Money } from './money';
import type { BreadcrumbItem, SocialLink } from './navigation';
import type { ActionRef, AuthorRef, ImageRef, LinkRef, RichText, SeoMeta } from './shared';

/** Fields every block has. */
export interface BlockBase {
  /** Unique within the page. Used for React keys and error reports. */
  id: string;
  /** Block type discriminator; selects the registry definition. */
  type: string;
  /** Becomes the section's id for #anchor links. Letters, digits, - and _; must start with a letter. */
  anchorId?: string;
  /** Section background. Default "default". */
  background?: 'default' | 'subtle' | 'accent' | 'inverse';
  /** Vertical padding of the section. Each block type has a sensible default. */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/* ---------- Item shapes ---------- */

/** An item in a feature grid. */
export interface FeatureItemContent {
  /** Icon name from the library's icon set, e.g. "check". */
  icon?: string;
  /** Short title. Guidance: under 50 characters. */
  title: string;
  /** One or two sentences. */
  description?: string;
  /** Makes the title a link. */
  link?: LinkRef;
}

/** A card. */
export interface CardItemContent {
  /** Card title; becomes the card's single link when `link` is set. */
  title: string;
  /** Short text under the title. */
  description?: string;
  /** Small label above the title, e.g. a category. */
  eyebrow?: string;
  /** Card image (cropped to 16:9). */
  image?: ImageRef;
  /** Card destination. */
  link?: LinkRef;
}

/** A blog or news article teaser. */
export interface ArticleTeaserContent {
  /** Article title. */
  title: string;
  /** Article URL. */
  href: string;
  /** One-sentence summary. */
  excerpt?: string;
  /** Category label. */
  category?: string;
  /** Publish date, ISO 8601, e.g. "2026-03-14". */
  publishedAt: string;
  /** Estimated reading time in minutes. */
  readingTimeMinutes?: number;
  /** Author name and optional avatar. */
  author?: AuthorRef;
  /** Teaser image. */
  image?: ImageRef;
}

/** A key figure. */
export interface StatItemContent {
  /** Already-formatted value, e.g. "1,200+" or "98%". */
  value: string;
  /** What the value measures. */
  label: string;
  /** Optional context. */
  description?: string;
}

/** A customer quote. */
export interface TestimonialContentRef {
  /** The quote, plain text without quotation marks. Guidance: under 300 characters. */
  quote: string;
  /** Who said it. */
  author: { name: string; role?: string; company?: string; avatar?: ImageRef };
  /** Company logo. */
  companyLogo?: ImageRef;
}

/** A logo in a logo strip. */
export interface LogoItemContent {
  /** Company name; used as the logo's alt text. */
  name: string;
  /** Logo image (its alt is ignored in favor of `name`). */
  image: ImageRef;
  /** Optional link, e.g. to a case study. */
  href?: string;
}

/** A question and answer. */
export interface FaqItemContent {
  /** Stable id, unique within the block. */
  id: string;
  /** The question. */
  question: string;
  /** The answer. */
  answer: RichText;
}

/** A pricing tier. */
export interface PricingTierContent {
  /** Stable id, unique within the block. */
  id: string;
  /** Plan name. */
  name: string;
  /** One-line summary. */
  description?: string;
  /** Price in minor units; null shows "Custom". */
  price: Money | null;
  /** Billing interval for `price`. */
  interval?: 'month' | 'year' | 'one-time';
  /** Price shown when the annual toggle is selected. */
  annualPrice?: Money | null;
  /** Feature checklist. */
  features: { label: string; included: boolean }[];
  /** Call to action. */
  cta: LinkRef;
  /** Visually emphasized; gets a text badge too. */
  highlighted?: boolean;
  /** Badge text, e.g. "Most popular". */
  badge?: string;
}

/** An image in a gallery. */
export interface GalleryImageContent extends ImageRef {
  /** Visible caption. */
  caption?: string;
}

/** A team member. */
export interface TeamMemberContentRef {
  /** Full name. */
  name: string;
  /** Job title. */
  role?: string;
  /** Portrait; initials are shown when missing. */
  photo?: ImageRef;
  /** Short bio, plain text. Guidance: under 300 characters. */
  bio?: string;
  /** Social profiles. */
  social?: SocialLink[];
}

/** A timeline event. */
export interface TimelineItemContent {
  /** Date or phase, e.g. "2019" or "Phase 2". */
  label: string;
  /** Event title. */
  title: string;
  /** Optional detail. */
  description?: string;
}

/** A step in a sequence. */
export interface StepItemContent {
  /** Step title. */
  title: string;
  /** Optional detail. */
  description?: string;
}

/** A table column. */
export interface TableColumnContent {
  /** Key into each row object. */
  key: string;
  /** Column header text. */
  header: string;
  /** Right-aligned with tabular numerals. */
  numeric?: boolean;
  /** Text alignment for non-numeric columns. */
  align?: 'start' | 'center' | 'end';
}

/** A tab. Content is EITHER rich text OR nested blocks (one level only: no tabs inside tabs). */
export interface TabContent {
  /** Stable id, unique within the block. */
  id: string;
  /** Tab label. */
  label: string;
  /** Rich text panel content. */
  richText?: RichText;
  /** Nested blocks panel content. Tabs blocks are not allowed here. */
  blocks?: NestedBlock[];
}

/* ---------- Blocks ---------- */

/** Page-opening block with a headline, subhead, up to two actions and optional media. */
export interface HeroBlock extends BlockBase {
  /** Block type. */
  type: 'hero';
  /** Main headline. Guidance: under 80 characters. */
  headline: string;
  /** Supporting sentence. */
  subhead?: string;
  /** First (primary) action. */
  primaryAction?: ActionRef;
  /** Second (secondary) action. */
  secondaryAction?: ActionRef;
  /** Hero image. Required for the "background" variant. */
  media?: ImageRef;
  /** Layout. Default "centered". */
  variant?: 'centered' | 'split' | 'background';
  /** Split variant: media side from 48rem. */
  mediaPosition?: 'start' | 'end';
}

/** Top of a content page: title, description, breadcrumbs, author and actions. */
export interface PageHeaderBlock extends BlockBase {
  /** Block type. */
  type: 'pageHeader';
  /** Page title. */
  title: string;
  /** Lead paragraph. */
  description?: string;
  /** Breadcrumb trail; the last item is the current page. Shown only when this block holds the page's h1. */
  breadcrumbs?: BreadcrumbItem[];
  /** Author byline. */
  author?: AuthorRef;
  /** Publish date, ISO 8601. */
  publishedAt?: string;
  /** Reading time, already formatted, e.g. "8 min read". */
  readingTime?: string;
  /** Up to two actions. */
  actions?: ActionRef[];
  /** Image for the "with-media" variant. */
  media?: ImageRef;
  /** Layout. Default "default". */
  variant?: 'default' | 'centered' | 'with-media';
}

/** Grid of short features with optional icons and links. */
export interface FeatureGridBlock extends BlockBase {
  /** Block type. */
  type: 'featureGrid';
  /** Section heading. */
  heading?: string;
  /** Intro paragraph. */
  intro?: string;
  /** Features. 1-12 items. */
  items: FeatureItemContent[];
  /** Columns on wide screens. Default 3. */
  columns?: 2 | 3 | 4;
  /** Icon placement. Default "stacked". */
  layout?: 'stacked' | 'inline-icon';
}

/** Grid of equal-height cards. */
export interface CardGridBlock extends BlockBase {
  /** Block type. */
  type: 'cardGrid';
  /** Section heading. */
  heading?: string;
  /** Intro paragraph. */
  intro?: string;
  /** Cards. 1-12 items. */
  items: CardItemContent[];
  /** Columns on wide screens. Default 3. */
  columns?: 2 | 3 | 4;
  /** Card style. Default "outlined". */
  variant?: 'elevated' | 'outlined' | 'flat';
}

/** Grid of article teasers (blog index, related posts). */
export interface ArticleCardGridBlock extends BlockBase {
  /** Block type. */
  type: 'articleCardGrid';
  /** Section heading. */
  heading?: string;
  /** Articles. 1-12 items. */
  items: ArticleTeaserContent[];
}

/** Image beside text with optional actions. */
export interface MediaTextBlock extends BlockBase {
  /** Block type. */
  type: 'mediaText';
  /** Small label above the heading. */
  eyebrow?: string;
  /** Heading. */
  heading: string;
  /** Body text. */
  body?: RichText;
  /** The image. */
  media: ImageRef;
  /** Up to two actions. */
  actions?: ActionRef[];
  /** Media side from 48rem. Default "start". */
  mediaPosition?: 'start' | 'end';
  /** "balanced" (1:1) or "wide" (media ~60%). Default "balanced". */
  mediaWidth?: 'balanced' | 'wide';
}

/** Call-to-action panel. */
export interface CtaBannerBlock extends BlockBase {
  /** Block type. */
  type: 'ctaBanner';
  /** Heading. */
  heading: string;
  /** Supporting text. */
  body?: string;
  /** Main action. */
  primaryAction: ActionRef;
  /** Optional second action. */
  secondaryAction?: ActionRef;
  /** Panel color. Default "accent". */
  variant?: 'accent' | 'inverse' | 'subtle';
  /** Default "centered". */
  layout?: 'centered' | 'split';
}

/** Key figures. */
export interface StatsBlock extends BlockBase {
  /** Block type. */
  type: 'stats';
  /** Section heading. */
  heading?: string;
  /** Figures. 2-8 items. */
  items: StatItemContent[];
  /** Columns on wide screens. Default: item count, max 4. */
  columns?: 2 | 3 | 4;
}

/** A single large testimonial. */
export interface TestimonialBlock extends BlockBase {
  /** Block type. */
  type: 'testimonial';
  /** The testimonial. */
  testimonial: TestimonialContentRef;
}

/** Two or three testimonials as cards. */
export interface TestimonialGridBlock extends BlockBase {
  /** Block type. */
  type: 'testimonialGrid';
  /** Section heading. */
  heading?: string;
  /** Testimonials. 1-3 items. */
  items: TestimonialContentRef[];
}

/** Row of customer or partner logos. */
export interface LogoStripBlock extends BlockBase {
  /** Block type. */
  type: 'logoStrip';
  /** Short label, e.g. "Trusted by". */
  heading?: string;
  /** Logos. 1-12 items. */
  items: LogoItemContent[];
  /** Muted grayscale logos. Default true. */
  grayscale?: boolean;
}

/** Frequently asked questions as an accordion. */
export interface FaqBlock extends BlockBase {
  /** Block type. */
  type: 'faq';
  /** Section heading. Default "Frequently asked questions". */
  heading?: string;
  /** Intro paragraph. */
  intro?: string;
  /** Questions. 1-30 items. */
  items: FaqItemContent[];
  /** Let several answers be open at once. */
  allowMultiple?: boolean;
}

/** Pricing tiers with an optional monthly/annual toggle. */
export interface PricingTableBlock extends BlockBase {
  /** Block type. */
  type: 'pricingTable';
  /** Section heading. */
  heading?: string;
  /** Intro paragraph. */
  intro?: string;
  /** Tiers. 1-4 items. */
  tiers: PricingTierContent[];
  /** Shown next to the annual option, e.g. "Save 20%". */
  annualSavingsLabel?: string;
}

/** Long-form rich text. */
export interface RichTextBlock extends BlockBase {
  /** Block type. */
  type: 'richText';
  /** The text. */
  content: RichText;
  /** "large" for short pages and lead-ins. Default "base". */
  size?: 'base' | 'large';
}

/** Image gallery with optional lightbox. */
export interface GalleryBlock extends BlockBase {
  /** Block type. */
  type: 'gallery';
  /** Section heading. */
  heading?: string;
  /** Images. 1-48 items. */
  images: GalleryImageContent[];
  /** "grid" (square crops) or "columns" (natural ratios). Default "grid". */
  layout?: 'grid' | 'columns';
  /** Columns on wide screens. Default 3. */
  columns?: 2 | 3 | 4;
  /** Open images in a lightbox. Default true. */
  lightbox?: boolean;
}

/** Click-to-load video. Nothing loads from the provider until the visitor presses play. */
export interface VideoEmbedBlock extends BlockBase {
  /** Block type. */
  type: 'videoEmbed';
  /** Video host. */
  provider: 'youtube' | 'vimeo' | 'generic';
  /** YouTube or Vimeo video id. Required for those providers. */
  videoId?: string;
  /** Embed URL. Required for "generic". */
  src?: string;
  /** Video title; names the player. */
  title: string;
  /** Local poster image. Never fetched from the provider. */
  poster?: ImageRef;
  /** CSS aspect ratio. Default "16 / 9". */
  aspectRatio?: string;
}

/** Click-to-load map with an address and directions link. */
export interface MapEmbedBlock extends BlockBase {
  /** Block type. */
  type: 'mapEmbed';
  /** Map embed URL (loaded only after the visitor asks). */
  src: string;
  /** Names the map. */
  title: string;
  /** Postal address, one line. */
  address: string;
  /** Directions URL. */
  directionsHref: string;
  /** Local placeholder image shown before activation. */
  placeholder?: ImageRef;
}

/** Team member grid. */
export interface TeamBlock extends BlockBase {
  /** Block type. */
  type: 'team';
  /** Section heading. */
  heading?: string;
  /** Intro paragraph. */
  intro?: string;
  /** Members. 1-24 items. */
  members: TeamMemberContentRef[];
  /** Columns on wide screens. Default 3. */
  columns?: 2 | 3 | 4;
}

/** Ordered events. */
export interface TimelineBlock extends BlockBase {
  /** Block type. */
  type: 'timeline';
  /** Section heading. */
  heading?: string;
  /** Events, in order. 1-24 items. */
  items: TimelineItemContent[];
}

/** A numbered sequence. */
export interface StepsBlock extends BlockBase {
  /** Block type. */
  type: 'steps';
  /** Section heading. */
  heading?: string;
  /** Steps, in order. 2-8 items. */
  items: StepItemContent[];
  /** 1-based step in progress (for progress indicators). */
  currentStep?: number;
}

/** Tabbed panels of rich text or nested blocks (one level deep). */
export interface TabsBlock extends BlockBase {
  /** Block type. */
  type: 'tabs';
  /** Section heading. */
  heading?: string;
  /** Accessible name of the tab list, e.g. "Service details". */
  label: string;
  /** Tabs. 2-8 items. */
  tabs: TabContent[];
}

/** Data table. */
export interface TableBlock extends BlockBase {
  /** Block type. */
  type: 'table';
  /** Required: names the table for assistive technology. */
  caption: string;
  /** Columns. 1-16 items. */
  columns: TableColumnContent[];
  /** Rows: objects keyed by column key. Missing or null values show a dash. Max 500 rows. */
  rows: Record<string, string | number | null>[];
  /** Zebra striping. */
  striped?: boolean;
  /** Compact rows. */
  dense?: boolean;
  /** Keep the header visible while scrolling (caps the table height). */
  stickyHeader?: boolean;
}

/** Contact form. Interactive only when the host app passes a submit handler. */
export interface ContactFormBlock extends BlockBase {
  /** Block type. */
  type: 'contactForm';
  /** Section heading. */
  heading?: string;
  /** Intro paragraph. */
  intro?: string;
  /** Subject options. 1-20 items. */
  subjectOptions: { value: string; label: string }[];
  /** Consent checkbox label; when set the checkbox is shown and required. */
  consentLabel?: string;
}

/** Newsletter sign-up. Interactive only when the host app passes a submit handler. */
export interface NewsletterSignupBlock extends BlockBase {
  /** Block type. */
  type: 'newsletterSignup';
  /** Section heading. */
  heading?: string;
  /** Supporting text. */
  description?: string;
  /** Default "inline". */
  layout?: 'inline' | 'stacked';
  /** Add an optional first-name field. */
  showName?: boolean;
  /** Consent checkbox label; when set the checkbox is shown and required. */
  consentLabel?: string;
  /** Submit button text. Default "Subscribe". */
  submitLabel?: string;
}

/** A horizontal rule between sections. */
export interface DividerBlock extends BlockBase {
  /** Block type. */
  type: 'divider';
  /** Optional short label in the middle of the line. */
  label?: string;
}

/** Vertical space. */
export interface SpacerBlock extends BlockBase {
  /** Block type. */
  type: 'spacer';
  /** Amount of space. */
  size: 'sm' | 'md' | 'lg' | 'xl';
}

/** Every block type. Discriminated on `type`. */
export type Block =
  | HeroBlock
  | PageHeaderBlock
  | FeatureGridBlock
  | CardGridBlock
  | ArticleCardGridBlock
  | MediaTextBlock
  | CtaBannerBlock
  | StatsBlock
  | TestimonialBlock
  | TestimonialGridBlock
  | LogoStripBlock
  | FaqBlock
  | PricingTableBlock
  | RichTextBlock
  | GalleryBlock
  | VideoEmbedBlock
  | MapEmbedBlock
  | TeamBlock
  | TimelineBlock
  | StepsBlock
  | TabsBlock
  | TableBlock
  | ContactFormBlock
  | NewsletterSignupBlock
  | DividerBlock
  | SpacerBlock;

/** Block type names. */
export type BlockType = Block['type'];

/** Blocks allowed inside a tab (no nested tabs). */
export type NestedBlock = Exclude<Block, TabsBlock>;

/** Every block type, as a runtime list (kept in sync with the union by a compile-time check). */
export const blockTypes = [
  'hero',
  'pageHeader',
  'featureGrid',
  'cardGrid',
  'articleCardGrid',
  'mediaText',
  'ctaBanner',
  'stats',
  'testimonial',
  'testimonialGrid',
  'logoStrip',
  'faq',
  'pricingTable',
  'richText',
  'gallery',
  'videoEmbed',
  'mapEmbed',
  'team',
  'timeline',
  'steps',
  'tabs',
  'table',
  'contactForm',
  'newsletterSignup',
  'divider',
  'spacer',
] as const satisfies readonly BlockType[];

// Compile-time: the runtime list covers every member of the union.
type MissingFromList = Exclude<BlockType, (typeof blockTypes)[number]>;
const _allBlockTypesListed: [MissingFromList] extends [never] ? true : MissingFromList = true;
void _allBlockTypesListed;

/** A page: metadata plus an ordered list of blocks. */
export interface PageContent {
  /** CMS entry id. */
  id: string;
  /** URL slug without leading slash, e.g. "about" or "blog/five-day-close"; "" for the home page. */
  slug: string;
  /** Page template name; interpreted by the host app (e.g. "landing", "article"). */
  template?: string;
  /** Metadata. */
  seo: SeoMeta;
  /** Blocks in display order. Ids unique within the page. */
  blocks: Block[];
}
