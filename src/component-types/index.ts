/*
 * Prop-facing data shapes used by components. Unlike src/content-types (JSON-serializable CMS data),
 * these may contain React nodes. The registry converts content types into these.
 */
export type {
  ActionLink,
  ArticleCardContent,
  Author,
  BillingInterval,
  CardContent,
  CtaContent,
  FaqItem,
  FeatureItem,
  HeroContent,
  ImageContent,
  LogoItem,
  MediaTextContent,
  PricingFeature,
  PricingTier,
  StatItem,
  TestimonialContent,
} from './sections';
export type {
  AuthorContent,
  CategoryItem,
  GalleryImage,
  MapContent,
  PageHeaderContent,
  ShareNetwork,
  StepItem,
  TableColumn,
  TableData,
  TeamMemberContent,
  TimelineItem,
  TocItem,
  VideoContent,
  VideoProvider,
} from './content';
