import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { installStoryListener, openStory } from '../support/storybook';

/*
 * One axe pass over every story (including skip-vrt ones) in the default theme at desktop width. The
 * visual suite already runs axe at each story's screenshot widths; this pass also covers stories that
 * are never captured. Stories that disable a rule say why next to the parameter (see the README).
 */
const indexPath = resolve(process.cwd(), 'storybook-static', 'index.json');
if (!existsSync(indexPath)) throw new Error('Run `npm run build-storybook` first (npm run test:a11y builds for you).');
const index = JSON.parse(readFileSync(indexPath, 'utf8')) as { entries: Record<string, { id: string; title: string; name: string; type: string }> };
const stories = Object.values(index.entries).filter((e) => e.type === 'story');

for (const story of stories) {
  test(`all › ${story.title} / ${story.name}`, async ({ page }) => {
    await page.addInitScript(installStoryListener);
    await page.setViewportSize({ width: 1280, height: 800 });
    let result = await openStory(page, story.id);
    // A story that declares its viewport (e.g. a phone-only sticky bar) is checked at that size.
    const first = result.vrt?.viewports?.[0];
    const width = typeof first === 'number' ? first : first?.width;
    if (width && width !== 1280) {
      await page.setViewportSize({ width, height: (typeof first === 'object' && first.height) || 800 });
      result = await openStory(page, story.id);
    }
    expect(result.problems, `axe and play results for ${story.id}`).toEqual([]);
    expect(result.status).toBe('success');
  });
}
