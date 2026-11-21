import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

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

interface StoryResult {
  status: 'success' | 'error' | 'missing';
  vrt: { viewports?: ViewportParam[] } | null;
  problems: string[];
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

declare global {
  interface Window {
    __vrtStoryResult?: Promise<StoryResult>;
    /** Starts waiting for the next storyFinished (used before a remount). */
    __vrtArm?: () => Promise<StoryResult>;
    __STORYBOOK_PREVIEW__?: { currentRender?: { story?: { parameters?: Record<string, unknown> } } };
  }
}

/** Runs before any page script: hooks Storybook's preview channel as soon as it is created. */
function installStoryListener() {
  type Report = { type: string; status: string; result?: { violations?: { id: string; help: string; nodes: { target: string[] }[] }[] } };
  type Channel = { on: (event: string, fn: (payload: never) => void) => void };

  let settle: (result: StoryResult) => void = () => {};
  window.__vrtArm = () => (window.__vrtStoryResult = new Promise((done) => (settle = done)));
  window.__vrtArm();

  const vrtParam = () =>
    (window.__STORYBOOK_PREVIEW__?.currentRender?.story?.parameters?.vrt as StoryResult['vrt']) ?? null;

  const listen = (channel: Channel) => {
    channel.on('storyFinished', ({ status, reporters }: { status: 'success' | 'error'; reporters: Report[] }) => {
      const problems = reporters
        .filter((r) => r.status === 'failed')
        .flatMap((r) =>
          r.result?.violations?.length
            ? r.result.violations.map((v) => `${r.type}: ${v.id} - ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)
            : [`${r.type} report failed`],
        );
      settle({ status, vrt: vrtParam(), problems });
    });
    channel.on('playFunctionThrewException', (error: { message?: string }) =>
      settle({ status: 'error', vrt: vrtParam(), problems: [`play function threw: ${error.message ?? 'unknown error'}`] }),
    );
    channel.on('storyThrewException', (error: { message?: string }) =>
      settle({ status: 'error', vrt: vrtParam(), problems: [`story threw: ${error.message ?? 'unknown error'}`] }),
    );
    channel.on('storyMissing', () => settle({ status: 'missing', vrt: null, problems: ['story not found'] }));
  };

  let current: Channel | undefined;
  Object.defineProperty(globalThis, '__STORYBOOK_ADDONS_CHANNEL__', {
    configurable: true,
    get: () => current,
    set(channel: Channel) {
      current = channel;
      listen(channel);
    },
  });
}

/** Waits for fonts and images, then lets components react to load/error events before capturing. */
async function settlePage(page: Page) {
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
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  });
}

/** First load of the story iframe. */
async function openStory(page: Page, id: string): Promise<StoryResult> {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  const result = await page.evaluate(() => window.__vrtStoryResult!);
  await settlePage(page);
  return result;
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

    // First load at the tag-derived viewport; this also tells us whether parameters.vrt overrides it.
    // If it does, this load was only a probe (its play function may assume another viewport), so its
    // result is checked only when the probe viewport is also the first one we capture.
    const tagCaptures = capturesFromTags(story.tags);
    let loaded: Capture | null = tagCaptures[0]!;
    await page.setViewportSize({ width: loaded.width, height: loaded.height });
    const probe = await openStory(page, story.id);
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
        await expect(page).toHaveScreenshot(`${story.id}-${capture.width}.png`, { fullPage: capture.fullPage });
      });
    }
  });
}
