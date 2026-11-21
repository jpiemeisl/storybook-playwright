import type { ComposedPage } from '../../content-types/templates';
import { SiteLayout } from '../SiteLayout';
import { layoutProps, TemplateBlocks } from '../TemplateBlocks';
import type { TemplateProps } from '../types';

/**
 * Composed pages (home, about, services, service detail, pricing, contact): the page's blocks inside
 * the full site chrome. The first hero or pageHeader block provides the h1.
 */
export function DefaultTemplate({ page, chrome, ctx }: TemplateProps<ComposedPage>) {
  return (
    <SiteLayout chrome={chrome} {...layoutProps(ctx)}>
      <TemplateBlocks blocks={page.blocks} ctx={ctx} />
    </SiteLayout>
  );
}
