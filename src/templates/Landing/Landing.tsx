import { StickyActionBar } from '../../components/StickyActionBar';
import type { LandingPage } from '../../content-types/templates';
import { useGuarded } from '../guard';
import { SiteLayout } from '../SiteLayout';
import { layoutProps, TemplateBlocks } from '../TemplateBlocks';
import type { TemplateProps } from '../types';

/**
 * Landing page: minimal chrome (logo-only header, legal-only footer, no navigation), blocks only, and
 * an optional call to action pinned to the bottom of narrow screens.
 */
export function Landing({ page, chrome, ctx }: TemplateProps<LandingPage>) {
  const sticky = useGuarded((g) => g.link(page.stickyCta, 'stickyCta'), [page], ctx?.onError);
  return (
    <SiteLayout chrome={chrome} variant="minimal" {...layoutProps(ctx)}>
      <TemplateBlocks blocks={page.blocks} ctx={ctx} />
      {sticky && <StickyActionBar action={sticky} message={page.stickyCtaMessage} />}
    </SiteLayout>
  );
}
