import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

/*
 * One visual regression test per Storybook story, generated from storybook-static/index.json.
 *
 * Tags:
 *   skip-vrt   - not captured (docs-only stories)
 *   vrt-mobile - also captured at 375px wide
 *   vrt-full   - captured at 375, 768 and 1280 wide as full-page screenshots
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

function capturesFor(tags: string[] = []): Capture[] {
  if (tags.includes('vrt-full')) {
    return [375, 768, 1280].map((width) => ({ width, height: 800, fullPage: true }));
  }
  const captures: Capture[] = [{ width: 1280, height: 800, fullPage: false }];
  if (tags.includes('vrt-mobile')) captures.push({ width: 375, height: 800, fullPage: false });
  return captures;
}

declare global {
  interface Window {
    __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } };
  }
}

async function waitForStoryReady(page: Page) {
  // Story finished rendering (and its play function, if any, has run).
  await page.waitForFunction(() => {
    const phase = window.__STORYBOOK_PREVIEW__?.currentRender?.phase;
    if (phase === 'errored' || phase === 'aborted') throw new Error(`Story render ${phase}`);
    return phase === 'completed' || phase === 'afterEach' || phase === 'finished';
  });
  await page.evaluate(async () => {
    // Lazy images outside the viewport never start loading (and full-page shots would miss them).
    for (const img of document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')) img.loading = 'eager';
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((done) => {
              img.addEventListener('load', done, { once: true });
              img.addEventListener('error', done, { once: true });
            }),
        ),
    );
    // Let components react to load/error events (e.g. Image's fallback) before capturing.
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  });
}

for (const story of stories) {
  for (const capture of capturesFor(story.tags)) {
    test(`${story.title} / ${story.name} @ ${capture.width}`, async ({ page }) => {
      await page.setViewportSize({ width: capture.width, height: capture.height });
      await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
      await waitForStoryReady(page);
      await expect(page).toHaveScreenshot(`${story.id}-${capture.width}.png`, { fullPage: capture.fullPage });
    });
  }
}
