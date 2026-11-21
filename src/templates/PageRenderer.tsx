import { useEffect, useMemo, useRef, type ComponentType } from 'react';
import type { PageContent } from '../content-types/blocks';
import type { SiteChrome } from '../content-types/chrome';
import type { Registry } from '../registry/registry';
import { defaultTemplates, resolveTemplate } from './registry';
import type { RenderContext, TemplateProps, Templates } from './types';

export interface PageRendererProps {
  /** The page (PageContent or any template page shape). `page.template` picks the template. */
  page: PageContent;
  /** Header, footer and announcement. */
  chrome: SiteChrome;
  /** Block registry (also settable as ctx.registry). Default: the built-in registry. */
  registry?: Registry;
  /** Templates. Default: the built-in templates; use createTemplates() to add or replace one. */
  templates?: Templates;
  ctx?: RenderContext;
}

/**
 * Renders a page with its template. Unknown template names, and pages missing the data their template
 * needs, render with the default template; both are reported through ctx.onError.
 */
export function PageRenderer({ page, chrome, registry, templates = defaultTemplates, ctx }: PageRendererProps) {
  const context = useMemo<RenderContext>(() => ({ ...ctx, registry: registry ?? ctx?.registry }), [ctx, registry]);
  const { definition, issues } = useMemo(() => resolveTemplate(page, templates), [page, templates]);
  const onErrorRef = useRef(ctx?.onError);
  onErrorRef.current = ctx?.onError;
  useEffect(() => issues.forEach((issue) => onErrorRef.current?.(issue)), [issues]);

  const Template = definition.component as ComponentType<TemplateProps>;
  return <Template page={page} chrome={chrome} ctx={context} />;
}
