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
const smoke = Object.values(index.entries).filter((e) => e.type === 'story' && e.tags?.includes('theme-smoke'));

test('the smoke set is not empty', () => expect(smoke.length).toBeGreaterThan(20));

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
