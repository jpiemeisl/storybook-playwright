/*
 * Content → props conversion helpers shared by block definitions.
 */
import type { ReactNode } from 'react';
import type { ActionLink, ImageContent } from '../component-types/sections';
import type { ActionRef, ImageRef, LinkRef, RichText } from '../content-types/shared';
import { Heading } from '../components/Heading';
import { iconNames, type IconName } from '../components/Icon';
import { Prose } from '../components/Prose';
import { Stack } from '../components/Stack';
import { Text } from '../components/Text';
import { isSafeHref, isSafeImageSrc, neutraliseUnsafeUrls } from './links';
import type { BlockContext } from './types';

/** ImageRef → Image props. Unsafe sources are dropped (reported); missing alt becomes "". */
export function toImage(ref: ImageRef | undefined, ctx: BlockContext, path: string): ImageContent | undefined {
  if (!ref) return undefined;
  if (!isSafeImageSrc(ref.src)) {
    ctx.report({ code: 'unsafe-src', message: `Image source ${JSON.stringify(ref.src)} was refused.`, path: `${path}.src` });
    return undefined;
  }
  return { src: ref.src, alt: ref.alt ?? '', width: ref.width, height: ref.height, srcSet: ref.srcSet, sizes: ref.sizes };
}

/** Returns the href if safe; otherwise reports and returns undefined, so the link renders as inert text. */
export function safeHref(href: string | undefined, ctx: BlockContext, path: string): string | undefined {
  if (href === undefined) return undefined;
  if (isSafeHref(href)) return href;
  ctx.report({ code: 'unsafe-href', message: `Link target ${JSON.stringify(href)} was refused and rendered as plain text.`, path });
  return undefined;
}

/** LinkRef/ActionRef → { label, href }. Unsafe → undefined (the component omits that action). */
export function toActionLink(ref: LinkRef | ActionRef | undefined, ctx: BlockContext, path: string): ActionLink | undefined {
  if (!ref) return undefined;
  const href = safeHref(ref.href, ctx, `${path}.href`);
  return href ? { label: ref.label, href } : undefined;
}

/** RichText → <Prose>. Unsafe link targets inside the HTML are neutralised (defence in depth). */
export function richTextNode(text: RichText | undefined, ctx: BlockContext, path: string, size: 'base' | 'large' = 'base'): ReactNode {
  if (!text || text.format !== 'html') return null;
  const { html, removed } = neutraliseUnsafeUrls(text.html);
  for (const value of removed) {
    ctx.report({ code: 'unsafe-href', message: `Rich text link/image target ${JSON.stringify(value)} was removed.`, path });
  }
  return <Prose size={size} sanitizedHtml={html} />;
}

/** Known icon names only; anything else is ignored. */
export function toIconName(name: string | undefined): IconName | undefined {
  return name && (iconNames as readonly string[]).includes(name) ? (name as IconName) : undefined;
}

type HeadingLevel = 1 | 2 | 3 | 4;
export const clampLevel = <L extends HeadingLevel>(level: number, allowed: readonly L[]): L =>
  allowed.reduce((best, candidate) => (Math.abs(candidate - level) < Math.abs(best - level) ? candidate : best), allowed[0]!);

/**
 * Heading + optional intro above a component, for components that have no heading of their own.
 * Registry-local adaptation: components themselves do not change shape.
 */
export function HeadedBlock({
  heading,
  intro,
  level,
  children,
}: {
  heading?: string;
  intro?: string;
  level: 1 | 2 | 3;
  children: ReactNode;
}) {
  if (!heading && !intro) return <>{children}</>;
  return (
    <Stack gap="lg">
      {(heading || intro) && (
        <Stack gap="sm" style={{ maxInlineSize: 'var(--measure)' }}>
          {heading && (
            <Heading as={`h${level}` as const} size="2xl">
              {heading}
            </Heading>
          )}
          {intro && (
            <Text size="lg" tone="muted">
              {intro}
            </Text>
          )}
        </Stack>
      )}
      {children}
    </Stack>
  );
}
