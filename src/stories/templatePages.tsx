/*
 * Story-only helpers for template stories: renders a page fixture through PageRenderer with a chrome
 * fixture, plus the page-level play assertions every template story runs. Not exported from the package.
 */
import { useMemo } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import type { SiteChrome } from '../content-types/chrome';
import chromeDefault from '../fixtures/chrome/default.json';
import chromeMinimal from '../fixtures/chrome/minimal.json';
import type { ValidationIssue } from '../registry/checker';
import { PageRenderer } from '../templates/PageRenderer';
import { fixturePage } from './contentModel';

export const chromes: Record<'default' | 'minimal', SiteChrome> = {
  default: chromeDefault as SiteChrome,
  minimal: chromeMinimal as SiteChrome,
};

export interface TemplateStoryArgs {
  /** Page fixture name in src/fixtures/pages. */
  name: string;
  chrome: keyof typeof chromes;
  onError: (issue: ValidationIssue) => void;
  onSearch?: (query: string) => void;
}

/** Shared meta pieces for template stories. */
export const templateMeta = {
  parameters: { layout: 'fullscreen' },
  args: { chrome: 'default' as const, onError: fn(), onSearch: fn() },
  render: (args: TemplateStoryArgs) => <TemplateFixture {...args} />,
};

export function TemplateFixture({ name, chrome, onError, onSearch }: TemplateStoryArgs) {
  const page = fixturePage(name);
  // Stable context, so re-renders do not re-report issues.
  const ctx = useMemo(() => ({ currentPath: `/${page.slug}`, onError, onSearch }), [page, onError, onSearch]);
  return <PageRenderer page={page} chrome={chromes[chrome]} ctx={ctx} />;
}

/**
 * Page-level landmarks. <header>/<footer> are banner/contentinfo only when not inside sectioning
 * content or <main> (HTML-AAM); Testing Library's role queries do not apply that rule.
 */
function pageLandmarks(root: Element, tag: 'header' | 'footer'): Element[] {
  return [...root.querySelectorAll(tag)].filter((el) => !el.parentElement?.closest('article, aside, main, nav, section, [role="main"]'));
}

/** Headings that are actually part of the page (not inside a closed dialog). */
function headingLevels(root: Element): number[] {
  return [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter((h) => !h.closest('dialog:not([open])')).map((h) => Number(h.tagName[1]));
}

/**
 * Page invariants: one banner, main and contentinfo (unless `bare`); exactly one h1 and no skipped
 * levels; unique ids; in-page links resolve; the skip link moves focus to <main>; no issues reported.
 */
export async function expectPageInvariants(canvasElement: HTMLElement, args: { onError: unknown }, options: { landmarks?: boolean; skipLink?: boolean } = {}) {
  const { landmarks = true, skipLink = true } = options;
  const canvas = within(canvasElement);
  if (landmarks) {
    await expect(pageLandmarks(canvasElement, 'header')).toHaveLength(1);
    await expect(pageLandmarks(canvasElement, 'footer')).toHaveLength(1);
  }
  await expect(canvas.getAllByRole('main')).toHaveLength(1);

  const levels = headingLevels(canvasElement);
  await expect(levels.filter((level) => level === 1)).toHaveLength(1);
  await expect(levels[0]).toBe(1);
  await expect(levels.flatMap((level, i) => (i > 0 && level > levels[i - 1]! + 1 ? [`h${levels[i - 1]} → h${level}`] : []))).toEqual([]);

  const ids = [...canvasElement.querySelectorAll('[id]')].map((el) => el.id);
  await expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  const fragments = [...canvasElement.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].map((a) => a.getAttribute('href')!.slice(1)).filter(Boolean);
  await expect(fragments.filter((id) => !document.getElementById(id))).toEqual([]);

  if (skipLink) {
    const skip = canvas.getByRole('link', { name: 'Skip to main content' });
    skip.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(document.activeElement?.id).toBe('main'));
    (document.activeElement as HTMLElement).blur();
    window.scrollTo(0, 0);
  }
  await expect(args.onError).not.toHaveBeenCalled();
}

/** The pagination page marked aria-current="page" (the numbered list is hidden on narrow screens, so query the DOM). */
export async function expectCurrentPage(canvasElement: HTMLElement, navLabel: string, page: number) {
  const nav = canvasElement.querySelector(`nav[aria-label="${navLabel}"]`);
  await expect([...(nav?.querySelectorAll('[aria-current="page"]') ?? [])].map((el) => el.getAttribute('aria-label'))).toContain(`Page ${page}`);
}

/** The nav link (header or footer) for `label` is marked aria-current="page". */
export async function expectCurrentNav(canvasElement: HTMLElement, label: string) {
  const current = [...canvasElement.querySelectorAll('header [aria-current="page"]')].map((el) => el.textContent?.trim());
  await expect(current).toContain(label);
}
