import type { Block } from '../content-types/blocks';
import { BlockRenderer } from '../registry/BlockRenderer';
import type { RenderContext } from './types';

/** BlockRenderer wired to the template context. Renders nothing for an empty list. */
export function TemplateBlocks({
  blocks,
  ctx,
  h1Provided = false,
  layout = 'page',
}: {
  blocks: readonly Block[] | undefined;
  ctx?: RenderContext;
  /** True when the template renders the page title itself (structured templates). */
  h1Provided?: boolean;
  layout?: 'page' | 'flow';
}) {
  if (!blocks?.length) return null;
  return (
    <BlockRenderer
      blocks={blocks}
      registry={ctx?.registry}
      context={ctx}
      onError={ctx?.onError}
      showErrors={ctx?.showErrors}
      h1Provided={h1Provided}
      layout={layout}
    />
  );
}

/** SiteLayout props that come from the render context. */
export const layoutProps = (ctx: RenderContext | undefined) => ({
  currentPath: ctx?.currentPath,
  onError: ctx?.onError,
  announcementDismissed: ctx?.announcementDismissed,
  onAnnouncementDismiss: ctx?.onAnnouncementDismiss,
  newsletter: ctx?.forms?.newsletter,
});
