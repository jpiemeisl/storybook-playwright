/*
 * Shared Storybook helpers for the Playwright specs (visual and a11y): a listener that resolves when
 * Storybook reports storyFinished (play function done, a11y addon run), page settling, and loading a
 * story in a theme.
 */
import type { Page } from '@playwright/test';

type ViewportParam = number | { width: number; height?: number; fullPage?: boolean };

export interface StoryResult {
  status: 'success' | 'error' | 'missing';
  /** viewports: override the tag viewports. screenshot: false runs play + a11y checks only. */
  vrt: { viewports?: ViewportParam[]; screenshot?: boolean; themes?: string[] } | null;
  problems: string[];
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
export function installStoryListener() {
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
export async function settlePage(page: Page) {
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

/** First load of the story iframe (optionally in a theme, via the `theme` global). */
export async function openStory(page: Page, id: string, theme?: string): Promise<StoryResult> {
  await page.goto(`/iframe.html?id=${id}&viewMode=story${theme ? `&globals=theme:${theme}` : ''}`);
  const result = await page.evaluate(() => window.__vrtStoryResult!);
  await settlePage(page);
  return result;
}

