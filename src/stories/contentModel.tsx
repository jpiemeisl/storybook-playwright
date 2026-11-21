/*
 * Story-only helpers for the content-model stories: JSON fixture loading, a site frame (header, main,
 * footer) around BlockRenderer, and play-function assertions. Not exported from the package.
 */
import type { ReactNode } from 'react';
import { expect } from 'storybook/test';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import type { Block, PageContent } from '../content-types/blocks';
import { footerColumns, headerCta, mainNav, socialLinks } from '../fixtures/navigation';
import { LegalContent } from './FooterContent';
import { Logo } from './Logo';

const pageModules = import.meta.glob<{ default: PageContent }>('../fixtures/pages/*.json', { eager: true });
const blockModules = import.meta.glob<{ default: Block }>('../fixtures/blocks/*.json', { eager: true });

function byName<T>(modules: Record<string, { default: T }>): Record<string, T> {
  return Object.fromEntries(Object.entries(modules).map(([path, mod]) => [path.replace(/^.*\/(.+)\.json$/, '$1'), mod.default]));
}

const pages = byName(pageModules);
const blocks = byName(blockModules);

export function fixturePage(name: string): PageContent {
  const page = pages[name];
  if (!page) throw new Error(`No page fixture named "${name}"`);
  return page;
}

/** Every per-block example, in the order of the registry's block type list. */
export function fixtureBlocks(order: readonly string[]): Block[] {
  return order.map((type) => {
    const block = blocks[type];
    if (!block) throw new Error(`No block fixture for "${type}"`);
    return block;
  });
}

/** Header, <main> and footer around page content, as a host app would render it. */
export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <Header logo={<Logo />} items={mainNav} cta={headerCta} sticky />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer logo={<Logo />} columns={footerColumns} social={socialLinks} legal={<LegalContent />} />
    </>
  );
}

/** Exactly one h1, it comes first, and no level is skipped going down (h2 → h4). */
export async function expectHeadingOutline(root: Element) {
  const levels = [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => Number(h.tagName[1]));
  await expect(levels.filter((level) => level === 1)).toHaveLength(1);
  await expect(levels[0]).toBe(1);
  const skips = levels.flatMap((level, i) => (i > 0 && level > levels[i - 1]! + 1 ? [`h${levels[i - 1]} → h${level}`] : []));
  await expect(skips).toEqual([]);
}

/** No link anywhere in the story uses a javascript: or data: URL. */
export async function expectNoUnsafeLinks(root: Element) {
  const unsafe = [...root.querySelectorAll('[href], [src]')]
    .map((el) => el.getAttribute('href') ?? el.getAttribute('src') ?? '')
    .filter((url) => /^\s*(javascript|data|vbscript):/i.test(url));
  await expect(unsafe).toEqual([]);
}
