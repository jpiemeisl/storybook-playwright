/*
 * Link and image safety for template data, mirroring the block helpers: unsafe targets are refused
 * (rendered as text or left out) and reported. Pages are mapped once per page object (useMemo) and the
 * collected issues are reported from an effect, so rendering stays pure.
 */
import { useEffect, useMemo, useRef } from 'react';
import type { ActionLink, ArticleCardContent, ImageContent } from '../component-types/sections';
import type { ImageRef, LinkRef } from '../content-types/shared';
import type { ArticleSummary } from '../content-types/templates';
import type { ValidationIssue } from '../registry/checker';
import { isSafeHref, isSafeImageSrc } from '../registry/links';

export interface Guard {
  issues: ValidationIssue[];
  /** The href if safe; otherwise reports and returns undefined. */
  href: (href: string | undefined, path: string) => string | undefined;
  /** LinkRef → { label, href } if safe. */
  link: (ref: LinkRef | undefined, path: string) => ActionLink | undefined;
  /** ImageRef → Image props if the source is safe. */
  image: (ref: ImageRef | undefined, path: string) => ImageContent | undefined;
  /** ArticleSummary → ArticleCard content; undefined (item left out) when its link is unsafe. */
  article: (summary: ArticleSummary, path: string) => ArticleCardContent | undefined;
}

export function createGuard(): Guard {
  const issues: ValidationIssue[] = [];
  const guard: Guard = {
    issues,
    href: (href, path) => {
      if (href === undefined) return undefined;
      if (isSafeHref(href)) return href;
      issues.push({ code: 'unsafe-href', severity: 'error', message: `Link target ${JSON.stringify(href)} was refused.`, path });
      return undefined;
    },
    link: (ref, path) => {
      const href = ref && guard.href(ref.href, `${path}.href`);
      return ref && href ? { label: ref.label, href } : undefined;
    },
    image: (ref, path) => {
      if (!ref) return undefined;
      if (!isSafeImageSrc(ref.src)) {
        issues.push({ code: 'unsafe-src', severity: 'error', message: `Image source ${JSON.stringify(ref.src)} was refused.`, path: `${path}.src` });
        return undefined;
      }
      return { src: ref.src, alt: ref.alt ?? '', width: ref.width, height: ref.height, srcSet: ref.srcSet, sizes: ref.sizes };
    },
    article: (summary, path) => {
      const href = guard.href(summary.href, `${path}.href`);
      if (!href) return undefined;
      const avatar = guard.image(summary.author?.avatar, `${path}.author.avatar`);
      return {
        title: summary.title,
        href,
        excerpt: summary.excerpt,
        category: summary.category,
        publishedAt: summary.publishedAt,
        readingTimeMinutes: summary.readingTime,
        author: summary.author ? { name: summary.author.name, ...(avatar ? { avatar } : {}) } : undefined,
        image: guard.image(summary.image, `${path}.image`),
      };
    },
  };
  return guard;
}

/** Maps page data once per `deps` change with a fresh Guard and reports its issues after commit. */
export function useGuarded<T>(map: (guard: Guard) => T, deps: readonly unknown[], onError?: (issue: ValidationIssue) => void): T {
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are the caller's page data
  const { value, issues } = useMemo(() => {
    const guard = createGuard();
    return { value: map(guard), issues: guard.issues };
  }, deps);
  useEffect(() => issues.forEach((issue) => onErrorRef.current?.(issue)), [issues]);
  return value;
}
