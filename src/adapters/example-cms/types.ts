/*
 * A deliberately CMS-flavoured payload shape (nested `fields`, `sys` metadata, snake_case keys, asset
 * references, rich text as a node tree). It is NOT any real CMS; it shows the kind of shape an adapter
 * has to translate.
 */

export interface CmsSys {
  id: string;
  content_type: string;
  updated_at?: string;
  locale?: string;
}

export interface CmsEntry<Fields> {
  sys: CmsSys;
  fields: Fields;
}

/** Asset reference: the CMS stores alt text as the asset's `title`. */
export interface CmsAsset {
  asset: { url: string; title?: string; width?: number; height?: number; mime_type?: string };
}

export interface CmsLink {
  label: string;
  url: string;
  open_in_new_tab?: boolean;
  style?: 'primary' | 'secondary' | 'link';
}

export type CmsRichTextNode =
  | { node_type: 'text'; value: string; marks?: ('bold' | 'italic')[] }
  | { node_type: 'hyperlink'; url: string; content: CmsRichTextNode[] }
  | {
      node_type: 'document' | 'paragraph' | 'heading_2' | 'heading_3' | 'heading_4' | 'unordered_list' | 'ordered_list' | 'list_item' | 'blockquote';
      content: CmsRichTextNode[];
    }
  /** Anything else the CMS might send (embeds, tables...). The converter drops these. */
  | { node_type: string; content?: CmsRichTextNode[]; value?: string };

export type CmsRichText = CmsRichTextNode[];

/** Sections ("modules" in this imaginary CMS). */
export type CmsSection =
  | CmsEntry<{ headline: string; sub_headline?: string; primary_cta?: CmsLink; secondary_cta?: CmsLink; hero_image?: CmsAsset; display_style?: 'centered' | 'split' | 'full_bleed' }> & { sys: { content_type: 'hero_section' } }
  | CmsEntry<{ title?: string; intro?: string; features: { label: string; summary?: string; icon_name?: string; link?: CmsLink }[]; columns?: number }> & { sys: { content_type: 'feature_list' } }
  | CmsEntry<{ body: CmsRichText; large_text?: boolean }> & { sys: { content_type: 'rich_text_section' } }
  | CmsEntry<{ kicker?: string; title: string; body?: CmsRichText; image: CmsAsset; image_side?: 'left' | 'right'; buttons?: CmsLink[] }> & { sys: { content_type: 'image_text_section' } }
  | CmsEntry<{ title: string; text?: string; button: CmsLink; second_button?: CmsLink; theme?: 'brand' | 'dark' | 'light' }> & { sys: { content_type: 'cta_section' } }
  | CmsEntry<{ title?: string; questions: { sys: CmsSys; fields: { question: string; answer: CmsRichText } }[] }> & { sys: { content_type: 'faq_section' } }
  | CmsEntry<{ title?: string; figures: { number: string; caption: string }[] }> & { sys: { content_type: 'stats_section' } }
  | CmsEntry<{ title?: string; quotes: { quote_text: string; person_name: string; person_title?: string; company_name?: string; photo?: CmsAsset }[] }> & { sys: { content_type: 'testimonials_section' } }
  | CmsEntry<{ title?: string; people: { full_name: string; job_title?: string; headshot?: CmsAsset; short_bio?: string }[] }> & { sys: { content_type: 'team_section' } };

export interface ExampleCmsPage
  extends CmsEntry<{
    title: string;
    slug: string;
    seo_title?: string;
    seo_description?: string;
    no_index?: boolean;
    page_template?: string;
    sections: CmsSection[];
  }> {
  sys: CmsSys & { content_type: 'page' };
}
