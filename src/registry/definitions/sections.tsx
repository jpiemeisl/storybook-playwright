/*
 * Marketing section blocks: hero, pageHeader, featureGrid, cardGrid, articleCardGrid, mediaText,
 * ctaBanner, stats, testimonial, testimonialGrid, logoStrip, pricingTable.
 */
import type { ArticleCardContent, TestimonialContent } from '../../component-types/sections';
import type {
  ArticleCardGridBlock,
  CardGridBlock,
  CtaBannerBlock,
  FeatureGridBlock,
  HeroBlock,
  LogoStripBlock,
  MediaTextBlock,
  PageHeaderBlock,
  PricingTableBlock,
  StatsBlock,
  TestimonialBlock,
  TestimonialContentRef,
  TestimonialGridBlock,
} from '../../content-types/blocks';
import type { PricingTier } from '../../component-types/sections';
import { ArticleCard } from '../../components/ArticleCard';
import { AuthorByline } from '../../components/AuthorByline';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { ButtonLink } from '../../components/Button';
import { Card, CardGrid, type CardProps } from '../../components/Card';
import { CtaBanner } from '../../components/CtaBanner';
import { FeatureGrid } from '../../components/FeatureGrid';
import { Hero } from '../../components/Hero';
import { Image } from '../../components/Image';
import { LogoStrip } from '../../components/LogoStrip';
import { MediaText } from '../../components/MediaText';
import { PageHeader } from '../../components/PageHeader';
import { PricingTable } from '../../components/PricingTable';
import { Stats } from '../../components/Stats';
import { Testimonial, TestimonialGrid } from '../../components/Testimonial';
import { clampLevel, HeadedBlock, richTextNode, safeHref, toActionLink, toIconName, toImage } from '../helpers';
import { defineBlock, type BlockContext } from '../types';

const toTestimonial = (t: TestimonialContentRef, ctx: BlockContext, path: string): TestimonialContent => ({
  quote: t.quote,
  author: { ...t.author, avatar: toImage(t.author.avatar, ctx, `${path}.author.avatar`) },
  companyLogo: toImage(t.companyLogo, ctx, `${path}.companyLogo`),
});

export const hero = defineBlock({
  type: 'hero',
  label: 'Hero',
  description: 'Page-opening headline with optional subhead, two actions and media.',
  example: 'hero',
  component: Hero,
  pageHeading: true,
  hasHeading: () => true,
  layout: (c: HeroBlock) => (c.variant === 'background' ? 'full-bleed' : 'contained'),
  defaultPadding: (c: HeroBlock) => (c.variant === 'background' ? 'none' : 'lg'),
  toProps: (c: HeroBlock, ctx) => ({
    headline: c.headline,
    subhead: c.subhead,
    primaryAction: toActionLink(c.primaryAction, ctx, 'primaryAction'),
    secondaryAction: toActionLink(c.secondaryAction, ctx, 'secondaryAction'),
    media: toImage(c.media, ctx, 'media'),
    variant: c.variant,
    mediaPosition: c.mediaPosition,
    headingLevel: ctx.headingLevel,
  }),
});

export const pageHeader = defineBlock({
  type: 'pageHeader',
  label: 'Page header',
  description: 'Title, description, breadcrumbs, byline and actions at the top of a content page.',
  example: 'pageHeader',
  component: PageHeader,
  pageHeading: true,
  hasHeading: () => true,
  defaultPadding: 'md',
  toProps: (c: PageHeaderBlock, ctx) => {
    const crumbs = c.breadcrumbs?.map((b, i) => ({ label: b.label, href: safeHref(b.href, ctx, `breadcrumbs[${i}].href`) }));
    const avatar = toImage(c.author?.avatar, ctx, 'author.avatar');
    const media = toImage(c.media, ctx, 'media');
    const actions = (c.actions ?? []).slice(0, 2).flatMap((action, i) => {
      const link = toActionLink(action, ctx, `actions[${i}]`);
      return link ? [{ ...link, variant: action.variant ?? (i === 0 ? 'primary' : 'secondary') }] : [];
    });
    return {
      title: c.title,
      description: c.description,
      headingLevel: clampLevel(ctx.headingLevel, [1, 2] as const),
      variant: c.variant,
      // Breadcrumbs describe the page: only the header holding the h1 shows them (one Breadcrumb landmark per page).
      breadcrumbs: crumbs?.length && ctx.headingLevel === 1 ? <Breadcrumbs items={crumbs} /> : undefined,
      meta:
        c.author || c.publishedAt || c.readingTime ? (
          <AuthorByline
            author={{ name: c.author?.name ?? '', role: c.author?.role, href: safeHref(c.author?.href, ctx, 'author.href'), avatar }}
            date={c.publishedAt}
            readingTime={c.readingTime}
          />
        ) : undefined,
      actions: actions.length
        ? actions.map((a) => (
            <ButtonLink key={a.href + a.label} href={a.href} variant={a.variant}>
              {a.label}
            </ButtonLink>
          ))
        : undefined,
      media: media ? <Image {...media} aspectRatio="4 / 3" loading="eager" /> : undefined,
    };
  },
});

export const featureGrid = defineBlock({
  type: 'featureGrid',
  label: 'Feature grid',
  description: 'Short features with icons, in 2-4 columns.',
  example: 'featureGrid',
  component: FeatureGrid,
  toProps: (c: FeatureGridBlock, ctx) => ({
    heading: c.heading,
    intro: c.intro,
    columns: c.columns,
    layout: c.layout,
    headingLevel: clampLevel(ctx.headingLevel, [2, 3] as const),
    items: c.items.map((item, i) => ({
      title: item.title,
      description: item.description,
      icon: toIconName(item.icon),
      href: safeHref(item.link?.href, ctx, `items[${i}].link.href`),
    })),
  }),
});

function CardGridView({ heading, intro, level, columns, cards }: { heading?: string; intro?: string; level: 1 | 2 | 3; columns?: number; cards: CardProps[] }) {
  return (
    <HeadedBlock heading={heading} intro={intro} level={level}>
      <CardGrid columns={columns}>
        {cards.map((card, i) => (
          <Card key={`${card.title}-${i}`} {...card} />
        ))}
      </CardGrid>
    </HeadedBlock>
  );
}

export const cardGrid = defineBlock({
  type: 'cardGrid',
  label: 'Card grid',
  description: 'Equal-height cards with images and links.',
  example: 'cardGrid',
  component: CardGridView,
  toProps: (c: CardGridBlock, ctx) => ({
    heading: c.heading,
    intro: c.intro,
    level: ctx.headingLevel,
    columns: c.columns,
    cards: c.items.map((item, i): CardProps => ({
      title: item.title,
      description: item.description,
      eyebrow: item.eyebrow,
      image: toImage(item.image, ctx, `items[${i}].image`),
      href: safeHref(item.link?.href, ctx, `items[${i}].link.href`),
      variant: c.variant,
      headingLevel: clampLevel(c.heading ? ctx.itemHeadingLevel : ctx.headingLevel, [2, 3, 4] as const),
    })),
  }),
});

function ArticleGridView({ heading, level, itemLevel, articles }: { heading?: string; level: 1 | 2 | 3; itemLevel: 2 | 3 | 4; articles: ArticleCardContent[] }) {
  return (
    <HeadedBlock heading={heading} level={level}>
      <CardGrid columns={3}>
        {articles.map((article) => (
          <ArticleCard key={article.href} article={article} headingLevel={itemLevel} />
        ))}
      </CardGrid>
    </HeadedBlock>
  );
}

export const articleCardGrid = defineBlock({
  type: 'articleCardGrid',
  label: 'Article grid',
  description: 'Blog or news teasers (blog index, related posts).',
  example: 'articleCardGrid',
  component: ArticleGridView,
  toProps: (c: ArticleCardGridBlock, ctx) => ({
    heading: c.heading,
    level: ctx.headingLevel,
    itemLevel: clampLevel(c.heading ? ctx.itemHeadingLevel : ctx.headingLevel, [2, 3, 4] as const),
    // ArticleCard needs a link: items with an unsafe href are left out (and reported).
    articles: c.items.flatMap((item, i): ArticleCardContent[] => {
      const href = safeHref(item.href, ctx, `items[${i}].href`);
      if (!href) return [];
      return [
        {
          ...item,
          href,
          image: toImage(item.image, ctx, `items[${i}].image`),
          author: item.author ? { name: item.author.name, avatar: toImage(item.author.avatar, ctx, `items[${i}].author.avatar`) } : undefined,
        },
      ];
    }),
  }),
});

export const mediaText = defineBlock({
  type: 'mediaText',
  label: 'Media and text',
  description: 'Image beside text with optional actions.',
  example: 'mediaText',
  component: MediaText,
  hasHeading: () => true,
  toProps: (c: MediaTextBlock, ctx) => {
    const media = toImage(c.media, ctx, 'media');
    return {
      eyebrow: c.eyebrow,
      heading: c.heading,
      body: richTextNode(c.body, ctx, 'body'),
      media: media ? <Image {...media} aspectRatio="4 / 3" /> : null,
      actions: (c.actions ?? []).flatMap((a, i) => toActionLink(a, ctx, `actions[${i}]`) ?? []),
      mediaPosition: c.mediaPosition,
      mediaWidth: c.mediaWidth,
      headingLevel: clampLevel(ctx.headingLevel, [2, 3, 4] as const),
    };
  },
});

export const ctaBanner = defineBlock({
  type: 'ctaBanner',
  label: 'Call to action',
  description: 'Panel with a heading and one or two actions.',
  example: 'ctaBanner',
  component: CtaBanner,
  hasHeading: () => true,
  toProps: (c: CtaBannerBlock, ctx) => {
    const primary = toActionLink(c.primaryAction, ctx, 'primaryAction');
    const secondary = toActionLink(c.secondaryAction, ctx, 'secondaryAction');
    const first = primary ?? secondary;
    if (!first) {
      ctx.report({ code: 'missing-field', message: 'A call to action needs at least one safe action.', path: 'primaryAction' });
      return null;
    }
    return {
      heading: c.heading,
      body: c.body,
      primaryAction: first,
      secondaryAction: primary ? secondary : undefined,
      variant: c.variant,
      layout: c.layout,
      headingLevel: clampLevel(ctx.headingLevel, [2, 3] as const),
    };
  },
});

export const stats = defineBlock({
  type: 'stats',
  label: 'Stats',
  description: 'Key figures in 2-4 columns.',
  example: 'stats',
  component: Stats,
  toProps: (c: StatsBlock, ctx) => ({ items: c.items, heading: c.heading, columns: c.columns, headingLevel: clampLevel(ctx.headingLevel, [2, 3] as const) }),
});

export const testimonial = defineBlock({
  type: 'testimonial',
  label: 'Testimonial',
  description: 'One large customer quote.',
  example: 'testimonial',
  component: Testimonial,
  hasHeading: () => false,
  toProps: (c: TestimonialBlock, ctx) => ({ ...toTestimonial(c.testimonial, ctx, 'testimonial'), variant: 'single' as const }),
});

function TestimonialGridView({ heading, level, items }: { heading?: string; level: 1 | 2 | 3; items: TestimonialContent[] }) {
  return (
    <HeadedBlock heading={heading} level={level}>
      <TestimonialGrid items={items} />
    </HeadedBlock>
  );
}

export const testimonialGrid = defineBlock({
  type: 'testimonialGrid',
  label: 'Testimonial grid',
  description: 'Two or three customer quotes as cards.',
  example: 'testimonialGrid',
  component: TestimonialGridView,
  toProps: (c: TestimonialGridBlock, ctx) => ({
    heading: c.heading,
    level: ctx.headingLevel,
    items: c.items.map((t, i) => toTestimonial(t, ctx, `items[${i}]`)),
  }),
});

export const logoStrip = defineBlock({
  type: 'logoStrip',
  label: 'Logo strip',
  description: 'Customer or partner logos.',
  example: 'logoStrip',
  component: LogoStrip,
  hasHeading: () => false,
  defaultPadding: 'sm',
  toProps: (c: LogoStripBlock, ctx) => ({
    heading: c.heading,
    grayscale: c.grayscale,
    items: c.items.flatMap((item, i) => {
      const image = toImage({ ...item.image, alt: item.name }, ctx, `items[${i}].image`);
      return image ? [{ name: item.name, image: { src: image.src, width: image.width, height: image.height }, href: safeHref(item.href, ctx, `items[${i}].href`) }] : [];
    }),
  }),
});

function PricingView({ heading, intro, level, ...table }: { heading?: string; intro?: string; level: 1 | 2 | 3 } & Parameters<typeof PricingTable>[0]) {
  return (
    <HeadedBlock heading={heading} intro={intro} level={level}>
      <PricingTable {...table} />
    </HeadedBlock>
  );
}

export const pricingTable = defineBlock({
  type: 'pricingTable',
  label: 'Pricing table',
  description: 'Pricing tiers with an optional monthly/annual toggle.',
  example: 'pricingTable',
  component: PricingView,
  toProps: (c: PricingTableBlock, ctx) => ({
    heading: c.heading,
    intro: c.intro,
    level: ctx.headingLevel,
    annualSavingsLabel: c.annualSavingsLabel,
    headingLevel: clampLevel(c.heading ? ctx.itemHeadingLevel : ctx.headingLevel, [2, 3, 4] as const),
    // A tier needs a link for its button: tiers with an unsafe CTA are left out (and reported).
    tiers: c.tiers.flatMap((tier, i): PricingTier[] => {
      const cta = toActionLink(tier.cta, ctx, `tiers[${i}].cta`);
      return cta ? [{ ...tier, cta }] : [];
    }),
  }),
});
