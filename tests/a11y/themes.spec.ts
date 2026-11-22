import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { themes } from '../../src/components/Theme/themes';
import { installStoryListener, openStory } from '../support/storybook';

/*
 * Accessibility across themes: every `theme-smoke` story in every theme at desktop. Each load runs
 * Storybook's a11y addon (axe, the standard rule set including color-contrast; preview.tsx sets
 * a11y.test: 'error'); its violations arrive with storyFinished and fail the test. Interaction states
 * (an open dialog, a mobile menu) come from the stories' play functions. No extra dependency: this
 * reuses the axe that the a11y addon already ships.
 */

const indexPath = resolve(process.cwd(), 'storybook-static', 'index.json');
if (!existsSync(indexPath)) throw new Error('Run `npm run build-storybook` first (npm run test:a11y builds for you).');
const index = JSON.parse(readFileSync(indexPath, 'utf8')) as { entries: Record<string, { id: string; title: string; name: string; type: string; tags?: string[] }> };
const stories = Object.values(index.entries).filter((e) => e.type === 'story');
const smoke = stories.filter((e) => e.tags?.includes('theme-smoke'));
/** The demo shop's checkpoint stories (journeys and keyboard stories are behaviour tests run by test:vrt). */
const shop = stories.filter((e) => e.title === 'Demo shop/Checkpoints');

test('the smoke and shop sets are not empty', () => {
  expect(smoke.length).toBeGreaterThan(20);
  expect(shop.length).toBeGreaterThan(8);
});

for (const { name: theme } of themes) {
  for (const story of smoke) {
    test(`${theme} › ${story.title} / ${story.name}`, async ({ page }) => {
      await page.addInitScript(installStoryListener);
      await page.setViewportSize({ width: 1280, height: 800 });
      const result = await openStory(page, story.id, theme);
      expect(result.problems, `axe and play results for ${story.id} in ${theme}`).toEqual([]);
      expect(result.status).toBe('success');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    });
  }
}

/** The demo shop checkpoints in every theme, at desktop and phone width. */
for (const { name: theme } of themes) {
  for (const story of shop) {
    for (const width of [1280, 375]) {
      test(`shop ${theme} ${width} › ${story.name}`, async ({ page }) => {
        await page.addInitScript(installStoryListener);
        await page.setViewportSize({ width, height: 800 });
        const result = await openStory(page, story.id, theme);
        // A story that declares its viewports (e.g. phone-only) is checked only at those widths.
        const declared = result.vrt?.viewports?.map((v) => (typeof v === 'number' ? v : v.width));
        test.skip(!!declared && !declared.includes(width), `${story.id} declares viewports ${declared}`);
        expect(result.problems, `axe and play results for ${story.id} in ${theme} at ${width}px`).toEqual([]);
        expect(result.status).toBe('success');
      });
    }
  }
}
