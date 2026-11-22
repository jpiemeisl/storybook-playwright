import type { ReactNode } from 'react';
import type { ComponentType } from 'react';
import type { PageContent } from '../content-types/blocks';
import type { SiteChrome } from '../content-types/chrome';
import type { Registry } from '../registry/registry';
import type { RendererContext } from '../registry/types';
import type { ValidationIssue } from '../registry/checker';

/** What the host app passes down to templates (and on to BlockRenderer). All optional. */
export interface RenderContext extends RendererContext {
  /** Block registry. Default: the built-in registry. */
  registry?: Registry;
  /** Called once per problem: unknown templates, missing template data, refused links, block issues. */
  onError?: (issue: ValidationIssue) => void;
  /** Visible placeholders for blocks that could not render (CMS previews). */
  showErrors?: boolean;
  /** Path of the page being viewed, e.g. "/blog/five-day-close"; marks the matching nav item. */
  currentPath?: string;
  /** Intercepts search form submits. Without it, search forms submit natively (GET, field "q"). */
  onSearch?: (query: string) => void;
  /** Controlled announcement dismissal (persist it yourself; the library never stores it). */
  announcementDismissed?: boolean;
  onAnnouncementDismiss?: () => void;
  /** Header controls from the host (search, account, cart), passed to SiteLayout. */
  headerActions?: ReactNode;
}

/** Props every template receives. */
export interface TemplateProps<P extends PageContent = PageContent> {
  page: P;
  chrome: SiteChrome;
  ctx?: RenderContext;
}

/** A registered template. */
export interface TemplateDefinition {
  /** Key in the templates record (PageContent.template). */
  name: string;
  /** Human name for editors and docs. */
  label: string;
  /** One-line description for editors and docs. */
  description: string;
  component: ComponentType<TemplateProps<never>>;
  /**
   * Whether the page has the structured data this template needs to render at all. When false,
   * PageRenderer falls back to the default template and reports why. Default: always true.
   */
  canRender?: (page: PageContent) => boolean;
}

/** Template definitions keyed by template name. */
export type Templates = Readonly<Record<string, TemplateDefinition>>;

/** Declares a template with a typed page shape; stored type-erased in a Templates record. */
export function defineTemplate<P extends PageContent>(definition: {
  name: string;
  label: string;
  description: string;
  component: ComponentType<TemplateProps<P>>;
  canRender?: (page: PageContent) => boolean;
}): TemplateDefinition {
  return definition as TemplateDefinition;
}
