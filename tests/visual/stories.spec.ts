import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { themes } from '../../src/components/Theme/themes';
import { installStoryListener, openStory, settlePage, type StoryResult } from '../support/storybook';

/*
 * One visual regression test per Storybook story, generated from storybook-static/index.json.
 *
 * Which viewports are captured, in order of precedence:
 *   1. parameters.vrt.viewports  e.g. { vrt: { viewports: [375] } } or [{ width: 375, height: 640, fullPage: true }]
 *   2. tags:
 *        skip-vrt   - not captured (docs-only stories)
 *        vrt-mobile - 1280 plus 375
 *        vrt-full   - 375, 768 and 1280 as full-page screenshots
 *   3. default: 1280×800 viewport screenshot
 *
 * Themes: stories tagged `theme-smoke` are also captured in every non-default theme (from the exported
 * `themes` list), at 1280 and 375 (and 768 when also tagged vrt-full), loaded with
 * `&globals=theme:<name>`. Their snapshots are named `<id>-<width>-<theme>.png`; default-theme names
 * stay `<id>-<width>.png`. `parameters.vrt.themes` overrides the list (e.g. [] to opt out).
 *
 * Screenshots are taken only after Storybook's `storyFinished` event, which fires once the story has
 * rendered, its play function has completed and the a11y addon has run axe. A failed play function
 * or an axe violation fails the test.
 */

interface IndexEntry {
  id: string;
  title: string;
  name: string;
  type: 'story' | 'docs';
  tags?: string[];
}

interface Capture {
  width: number;
  height: number;
  fullPage: boolean;
}

type ViewportParam = number | { width: number; height?: number; fullPage?: boolean };



const PORT = 6007;
/** Full-page captures hide fixed purchase bars (see the file). */
const FULL_PAGE_CSS = resolve(process.cwd(), 'tests', 'visual', 'fullpage.css');

const indexPath = resolve(process.cwd(), 'storybook-static', 'index.json');

if (!existsSync(indexPath)) {
  throw new Error(
    `Storybook index not found at ${indexPath}.\nRun \`npm run build-storybook\` first (or use \`npm run test:vrt\`, which builds for you).`,
  );
}

const index = JSON.parse(readFileSync(indexPath, 'utf8')) as { entries: Record<string, IndexEntry> };

const stories = Object.values(index.entries).filter(
  (entry) => entry.type === 'story' && !entry.tags?.includes('skip-vrt'),
);

function capturesFromTags(tags: string[] = []): Capture[] {
  if (tags.includes('vrt-full')) {
    return [375, 768, 1280].map((width) => ({ width, height: 800, fullPage: true }));
  }
  const captures: Capture[] = [{ width: 1280, height: 800, fullPage: false }];
  if (tags.includes('vrt-mobile')) captures.push({ width: 375, height: 800, fullPage: false });
  return captures;
}

function capturesFromParam(viewports: ViewportParam[]): Capture[] {
  return viewports.map((v) =>
    typeof v === 'number'
      ? { width: v, height: 800, fullPage: false }
      : { width: v.width, height: v.height ?? 800, fullPage: v.fullPage ?? false },
  );
}

const EXTRA_THEMES = themes.map((t) => t.name).filter((name) => name !== 'default');

/**
 * Theme captures: desktop and mobile (tablet only for vrt-full), full-page when the story's captures
 * are. A story with explicit vrt.viewports (e.g. a desktop-only dropdown) keeps only those widths.
 */
function themeCaptures(captures: Capture[], tags: string[] = [], explicit = false): Capture[] {
  const fullPage = captures.some((c) => c.fullPage);
  const widths = [1280, 375, ...(tags.includes('vrt-full') ? [768] : [])];
  if (explicit) return captures.filter((c) => widths.includes(c.width));
  return widths.map((width) => captures.find((c) => c.width === width) ?? { width, height: 800, fullPage });
}

/**
 * Re-renders the story in place (Storybook's forceRemount) after a viewport change. Much cheaper than
 * a page reload, and the story still mounts fresh at the new size: play function, a11y check and
 * storyFinished all run again.
 */
async function remountStory(page: Page, id: string): Promise<StoryResult> {
  const result = await page.evaluate((storyId) => {
    window.scrollTo(0, 0);
    const finished = window.__vrtArm!();
    const channel = (window as unknown as { __STORYBOOK_ADDONS_CHANNEL__: { emit: (event: string, payload: unknown) => void } })
      .__STORYBOOK_ADDONS_CHANNEL__;
    channel.emit('forceRemount', { storyId });
    return finished;
  }, id);
  await settlePage(page);
  return result;
}

function expectClean(result: StoryResult, id: string, width: number) {
  expect(result.problems, `Story ${id} did not finish cleanly at ${width}px`).toEqual([]);
  expect(result.status, `Story ${id} status at ${width}px`).toBe('success');
}

for (const story of stories) {
  test(`${story.title} / ${story.name}`, async ({ page }) => {
    await page.addInitScript(installStoryListener);

    // Stories must never reach the network beyond the local Storybook server.
    const external: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (!/^(data|blob|about):/.test(url) && !url.startsWith(`http://localhost:${PORT}/`)) external.push(url);
    });

    // First load at the tag-derived viewport; this also tells us whether parameters.vrt overrides it.
    // If it does, this load was only a probe (its play function may assume another viewport), so its
    // result is checked only when the probe viewport is also the first one we capture.
    const tagCaptures = capturesFromTags(story.tags);
    let loaded: Capture | null = tagCaptures[0]!;
    await page.setViewportSize({ width: loaded.width, height: loaded.height });
    const probe = await openStory(page, story.id);
    if (probe.vrt?.screenshot === false) {
      // Interaction-only story (e.g. activating an embed): check it, never capture it. Its first
      // vrt.viewports entry, if any, is the viewport it runs at (e.g. a phone-only sticky bar).
      const want = probe.vrt.viewports?.length ? capturesFromParam(probe.vrt.viewports)[0]! : loaded;
      if (want.width !== loaded.width || want.height !== loaded.height) {
        await page.setViewportSize({ width: want.width, height: want.height });
        expectClean(await openStory(page, story.id), story.id, want.width);
      } else {
        expectClean(probe, story.id, loaded.width);
      }
      expect(external, 'external network requests').toEqual([]);
      return;
    }
    const captures = probe.vrt?.viewports?.length ? capturesFromParam(probe.vrt.viewports) : tagCaptures;
    if (captures[0]!.width === loaded.width && captures[0]!.height === loaded.height) {
      expectClean(probe, story.id, loaded.width);
    } else {
      loaded = null;
    }

    for (const capture of captures) {
      await test.step(`${capture.width}px`, async () => {
        // New viewport: remount so play functions, media queries and the a11y check run at that size.
        // After a probe at another viewport (whose play may have failed there by design), load fresh.
        if (!loaded || capture.width !== loaded.width || capture.height !== loaded.height) {
          await page.setViewportSize({ width: capture.width, height: capture.height });
          const result = loaded ? await remountStory(page, story.id) : await openStory(page, story.id);
          expectClean(result, story.id, capture.width);
          loaded = capture;
        }
        await expect(page).toHaveScreenshot(`${story.id}-${capture.width}.png`, { fullPage: capture.fullPage, ...(capture.fullPage ? { stylePath: FULL_PAGE_CSS } : {}) });
      });
    }

    const extraThemes = probe.vrt?.themes ?? (story.tags?.includes('theme-smoke') ? EXTRA_THEMES : []);
    for (const theme of extraThemes.filter((t) => t !== 'default')) {
      for (const capture of themeCaptures(captures, story.tags, !!probe.vrt?.viewports?.length)) {
        await test.step(`${theme} ${capture.width}px`, async () => {
          await page.setViewportSize({ width: capture.width, height: capture.height });
          const result = await openStory(page, story.id, theme);
          expectClean(result, story.id, capture.width);
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
          await expect(page).toHaveScreenshot(`${story.id}-${capture.width}-${theme}.png`, { fullPage: capture.fullPage, ...(capture.fullPage ? { stylePath: FULL_PAGE_CSS } : {}) });
        });
      }
    }
    expect(external, 'external network requests').toEqual([]);
  });
}
