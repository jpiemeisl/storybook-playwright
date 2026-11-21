/*
 * Content and media blocks: faq, richText, gallery, videoEmbed, mapEmbed, team, timeline, steps,
 * tabs, table, divider, spacer.
 */
import type { ReactNode } from 'react';
import type {
  DividerBlock,
  FaqBlock,
  GalleryBlock,
  MapEmbedBlock,
  RichTextBlock,
  SpacerBlock,
  StepsBlock,
  TableBlock,
  TabsBlock,
  TeamBlock,
  TimelineBlock,
  VideoEmbedBlock,
} from '../../content-types/blocks';
import type { GalleryImage, TeamMemberContent } from '../../component-types/content';
import { FaqSection } from '../../components/Accordion';
import { Divider } from '../../components/Divider';
import { Gallery } from '../../components/Gallery';
import { MapEmbed } from '../../components/MapEmbed';
import { Table } from '../../components/Table';
import { Tabs, type TabItem } from '../../components/Tabs';
import { TeamGrid } from '../../components/TeamMember';
import { Steps, Timeline } from '../../components/Timeline';
import { VideoEmbed } from '../../components/VideoEmbed';
import { clampLevel, HeadedBlock, richTextNode, safeHref, toImage } from '../helpers';
import { defineBlock } from '../types';
import styles from '../BlockRenderer.module.css';

export const faq = defineBlock({
  type: 'faq',
  label: 'FAQ',
  description: 'Questions and answers as an accordion.',
  example: 'faq',
  component: FaqSection,
  hasHeading: () => true,
  layout: 'narrow',
  toProps: (c: FaqBlock, ctx) => ({
    heading: c.heading,
    intro: c.intro,
    allowMultiple: c.allowMultiple,
    headingLevel: clampLevel(ctx.headingLevel, [2, 3] as const),
    items: c.items.map((item, i) => ({ id: item.id, question: item.question, answer: richTextNode(item.answer, ctx, `items[${i}].answer`) })),
  }),
});

function RichTextView({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const richText = defineBlock({
  type: 'richText',
  label: 'Rich text',
  description: 'Long-form formatted text.',
  example: 'richText',
  component: RichTextView,
  hasHeading: () => false,
  toProps: (c: RichTextBlock, ctx) => ({ children: richTextNode(c.content, ctx, 'content', c.size) }),
});

function GalleryView({ heading, level, ...gallery }: { heading?: string; level: 1 | 2 | 3 } & Parameters<typeof Gallery>[0]) {
  return (
    <HeadedBlock heading={heading} level={level}>
      <Gallery {...gallery} />
    </HeadedBlock>
  );
}

export const gallery = defineBlock({
  type: 'gallery',
  label: 'Gallery',
  description: 'Image gallery with an optional lightbox.',
  example: 'gallery',
  component: GalleryView,
  toProps: (c: GalleryBlock, ctx) => ({
    heading: c.heading,
    level: ctx.headingLevel,
    layout: c.layout,
    columns: c.columns,
    lightbox: c.lightbox,
    label: c.heading ?? 'Gallery',
    images: c.images.flatMap((image, i): GalleryImage[] => {
      const img = toImage(image, ctx, `images[${i}]`);
      return img ? [{ src: img.src, alt: img.alt, width: image.width ?? 1200, height: image.height ?? 800, caption: image.caption }] : [];
    }),
  }),
});

export const videoEmbed = defineBlock({
  type: 'videoEmbed',
  label: 'Video',
  description: 'Click-to-load YouTube, Vimeo or other embed.',
  example: 'videoEmbed',
  component: VideoEmbed,
  hasHeading: () => false,
  layout: 'narrow',
  toProps: (c: VideoEmbedBlock, ctx) => ({
    provider: c.provider,
    videoId: c.videoId,
    src: safeHref(c.src, ctx, 'src'),
    title: c.title,
    poster: toImage(c.poster, ctx, 'poster'),
    aspectRatio: c.aspectRatio,
  }),
});

export const mapEmbed = defineBlock({
  type: 'mapEmbed',
  label: 'Map',
  description: 'Click-to-load map with an address and directions link.',
  example: 'mapEmbed',
  component: MapEmbed,
  hasHeading: () => false,
  layout: 'narrow',
  toProps: (c: MapEmbedBlock, ctx) => {
    const src = safeHref(c.src, ctx, 'src');
    const directionsHref = safeHref(c.directionsHref, ctx, 'directionsHref');
    if (!src || !directionsHref) return null;
    return { src, directionsHref, title: c.title, address: c.address, placeholder: toImage(c.placeholder, ctx, 'placeholder') };
  },
});

function TeamView({ heading, intro, level, ...grid }: { heading?: string; intro?: string; level: 1 | 2 | 3 } & Parameters<typeof TeamGrid>[0]) {
  return (
    <HeadedBlock heading={heading} intro={intro} level={level}>
      <TeamGrid {...grid} />
    </HeadedBlock>
  );
}

export const team = defineBlock({
  type: 'team',
  label: 'Team',
  description: 'Team members with photos, roles and short bios.',
  example: 'team',
  component: TeamView,
  toProps: (c: TeamBlock, ctx) => ({
    heading: c.heading,
    intro: c.intro,
    level: ctx.headingLevel,
    columns: c.columns,
    headingLevel: clampLevel(c.heading ? ctx.itemHeadingLevel : ctx.headingLevel, [2, 3, 4] as const),
    members: c.members.map(
      (m, i): TeamMemberContent => ({
        name: m.name,
        role: m.role,
        bio: m.bio,
        photo: toImage(m.photo, ctx, `members[${i}].photo`),
        social: m.social?.filter((s, j) => safeHref(s.href, ctx, `members[${i}].social[${j}].href`)),
      }),
    ),
  }),
});

function TimelineView({ heading, level, ...timeline }: { heading?: string; level: 1 | 2 | 3 } & Parameters<typeof Timeline>[0]) {
  return (
    <HeadedBlock heading={heading} level={level}>
      <Timeline {...timeline} />
    </HeadedBlock>
  );
}

function StepsView({ heading, level, ...stepsProps }: { heading?: string; level: 1 | 2 | 3 } & Parameters<typeof Steps>[0]) {
  return (
    <HeadedBlock heading={heading} level={level}>
      <Steps {...stepsProps} />
    </HeadedBlock>
  );
}

export const timeline = defineBlock({
  type: 'timeline',
  label: 'Timeline',
  description: 'Ordered events, alternating on wide screens.',
  example: 'timeline',
  component: TimelineView,
  toProps: (c: TimelineBlock, ctx) => ({
    heading: c.heading,
    level: ctx.headingLevel,
    items: c.items,
    headingLevel: clampLevel(c.heading ? ctx.itemHeadingLevel : ctx.headingLevel, [2, 3, 4] as const),
  }),
});

export const steps = defineBlock({
  type: 'steps',
  label: 'Steps',
  description: 'A numbered sequence, optionally showing progress.',
  example: 'steps',
  component: StepsView,
  toProps: (c: StepsBlock, ctx) => ({
    heading: c.heading,
    level: ctx.headingLevel,
    items: c.items,
    currentStep: c.currentStep,
    headingLevel: clampLevel(c.heading ? ctx.itemHeadingLevel : ctx.headingLevel, [2, 3, 4] as const),
  }),
});

function TabsView({ heading, level, label, tabs }: { heading?: string; level: 1 | 2 | 3; label: string; tabs: TabItem[] }) {
  return (
    <HeadedBlock heading={heading} level={level}>
      <Tabs label={label} tabs={tabs} />
    </HeadedBlock>
  );
}

export const tabs = defineBlock({
  type: 'tabs',
  label: 'Tabs',
  description: 'Tabbed panels of rich text or nested blocks (one level).',
  example: 'tabs',
  component: TabsView,
  toProps: (c: TabsBlock, ctx) => ({
    heading: c.heading,
    level: ctx.headingLevel,
    label: c.label,
    tabs: c.tabs.map(
      (tab, i): TabItem => ({
        id: tab.id,
        label: tab.label,
        content: (
          <div className={styles.tabPanel}>
            {richTextNode(tab.richText, ctx, `tabs[${i}].richText`)}
            {tab.blocks && ctx.renderNested(tab.blocks)}
          </div>
        ),
      }),
    ),
  }),
});

export const table = defineBlock({
  type: 'table',
  label: 'Table',
  description: 'Data table in a keyboard-scrollable region.',
  example: 'table',
  component: Table,
  hasHeading: () => false,
  toProps: (c: TableBlock) => ({
    caption: c.caption,
    columns: c.columns.map((col) => ({ key: col.key, header: col.header, numeric: col.numeric, align: col.align })),
    rows: c.rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value ?? undefined]))),
    striped: c.striped,
    dense: c.dense,
    stickyHeader: c.stickyHeader,
  }),
});

export const divider = defineBlock({
  type: 'divider',
  label: 'Divider',
  description: 'A horizontal rule, optionally labelled.',
  example: 'divider',
  component: Divider,
  hasHeading: () => false,
  defaultPadding: 'sm',
  toProps: (c: DividerBlock) => ({ label: c.label }),
});

function SpacerView({ size }: { size: SpacerBlock['size'] }) {
  return <div className={styles.spacer} data-size={size} aria-hidden="true" />;
}

export const spacer = defineBlock({
  type: 'spacer',
  label: 'Spacer',
  description: 'Extra vertical space between sections.',
  example: 'spacer',
  component: SpacerView,
  hasHeading: () => false,
  layout: 'full-bleed',
  defaultPadding: 'none',
  toProps: (c: SpacerBlock) => ({ size: c.size }),
});
