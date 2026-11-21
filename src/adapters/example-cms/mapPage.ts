/*
 * Example adapter: ExampleCmsPage → PageContent. Reference implementation only (see README.md).
 */
import type { Block, PageContent } from '../../content-types/blocks';
import type { ActionRef, ImageRef, LinkRef, RichText } from '../../content-types/shared';
import { richTextToHtml } from './richText';
import type { CmsAsset, CmsLink, CmsRichText, CmsSection, ExampleCmsPage } from './types';

/* ---------- shared field mappers ---------- */

export function mapAsset(asset: CmsAsset | undefined): ImageRef | undefined {
  if (!asset?.asset?.url) return undefined;
  const { url, title, width, height } = asset.asset;
  // This CMS stores alt text in the asset title; an empty title means decorative.
  return { src: url, alt: title ?? '', width, height };
}

export function mapLink(link: CmsLink | undefined): LinkRef | undefined {
  if (!link?.url || !link.label) return undefined;
  return { label: link.label, href: link.url, external: link.open_in_new_tab || undefined };
}

export function mapAction(link: CmsLink | undefined): ActionRef | undefined {
  const mapped = mapLink(link);
  if (!mapped) return undefined;
  const variant = link?.style === 'link' ? 'ghost' : link?.style;
  return variant ? { ...mapped, variant } : mapped;
}

export function mapRichText(nodes: CmsRichText | undefined): RichText | undefined {
  const html = richTextToHtml(nodes);
  return html ? { format: 'html', html } : undefined;
}

/** Drops undefined values so the output stays tidy JSON. */
function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

/* ---------- per-section mappers ---------- */

type Mapper<S extends CmsSection> = (section: S) => Block;
type SectionOf<K extends CmsSection['sys']['content_type']> = Extract<CmsSection, { sys: { content_type: K } }>;

const mappers: { [K in CmsSection['sys']['content_type']]: Mapper<SectionOf<K>> } = {
  hero_section: ({ sys, fields }) =>
    compact({
      id: sys.id,
      type: 'hero',
      headline: fields.headline,
      subhead: fields.sub_headline,
      primaryAction: mapAction(fields.primary_cta),
      secondaryAction: mapAction(fields.secondary_cta),
      media: mapAsset(fields.hero_image),
      variant: fields.display_style === 'full_bleed' ? 'background' : fields.display_style,
    }),
  feature_list: ({ sys, fields }) =>
    compact({
      id: sys.id,
      type: 'featureGrid',
      heading: fields.title,
      intro: fields.intro,
      columns: fields.columns === 2 || fields.columns === 4 ? fields.columns : 3,
      items: fields.features.map((f) => compact({ title: f.label, description: f.summary, icon: f.icon_name, link: mapLink(f.link) })),
    }),
  rich_text_section: ({ sys, fields }) =>
    compact({
      id: sys.id,
      type: 'richText',
      content: mapRichText(fields.body) ?? { format: 'html', html: '' },
      size: fields.large_text ? 'large' : undefined,
    }),
  image_text_section: ({ sys, fields }) =>
    compact({
      id: sys.id,
      type: 'mediaText',
      eyebrow: fields.kicker,
      heading: fields.title,
      body: mapRichText(fields.body),
      media: mapAsset(fields.image) ?? { src: '', alt: '' },
      mediaPosition: fields.image_side === 'right' ? 'end' : 'start',
      actions: fields.buttons?.flatMap((b) => mapAction(b) ?? []),
    }),
  cta_section: ({ sys, fields }) =>
    compact({
      id: sys.id,
      type: 'ctaBanner',
      heading: fields.title,
      body: fields.text,
      primaryAction: mapAction(fields.button) ?? { label: '', href: '' },
      secondaryAction: mapAction(fields.second_button),
      variant: fields.theme === 'dark' ? 'inverse' : fields.theme === 'light' ? 'subtle' : 'accent',
    }),
  faq_section: ({ sys, fields }) =>
    compact({
      id: sys.id,
      type: 'faq',
      heading: fields.title,
      items: fields.questions.map((q) => ({ id: q.sys.id, question: q.fields.question, answer: mapRichText(q.fields.answer) ?? { format: 'html', html: '' } })),
    }),
  stats_section: ({ sys, fields }) =>
    compact({ id: sys.id, type: 'stats', heading: fields.title, items: fields.figures.map((f) => ({ value: f.number, label: f.caption })) }),
  testimonials_section: ({ sys, fields }) =>
    compact({
      id: sys.id,
      type: 'testimonialGrid',
      heading: fields.title,
      items: fields.quotes.map((q) =>
        compact({ quote: q.quote_text, author: compact({ name: q.person_name, role: q.person_title, company: q.company_name, avatar: mapAsset(q.photo) }) }),
      ),
    }),
  team_section: ({ sys, fields }) =>
    compact({
      id: sys.id,
      type: 'team',
      heading: fields.title,
      members: fields.people.map((p) => compact({ name: p.full_name, role: p.job_title, photo: mapAsset(p.headshot), bio: p.short_bio })),
    }),
};

export interface MapPageOptions {
  /** Called for CMS section types this adapter does not know. They are left out of the page. */
  onUnmapped?: (section: { id: string; contentType: string }) => void;
}

export function mapSection(section: CmsSection, options: MapPageOptions = {}): Block | undefined {
  const mapper = mappers[section.sys.content_type] as Mapper<CmsSection> | undefined;
  if (!mapper) {
    options.onUnmapped?.({ id: section.sys.id, contentType: section.sys.content_type });
    return undefined;
  }
  return mapper(section);
}

export function mapPage(page: ExampleCmsPage, options: MapPageOptions = {}): PageContent {
  const { sys, fields } = page;
  return compact({
    id: sys.id,
    slug: fields.slug.replace(/^\/+/, ''),
    template: fields.page_template,
    seo: compact({ title: fields.seo_title ?? fields.title, description: fields.seo_description, noindex: fields.no_index || undefined }),
    blocks: fields.sections.flatMap((section) => mapSection(section, options) ?? []),
  });
}
