#!/usr/bin/env node
/*
 * Story tag check (plain Node, no dependencies). Run after `npm run build-storybook`.
 *
 * Why: Storybook reads `tags` statically from the story files. Tags spread in from a shared object
 * (`{ ...full, args }`) are silently dropped, so a story meant for three viewports gets captured at
 * the wrong widths and nothing fails. This check reads storybook-static/index.json and fails when a
 * story listed below lacks its expected tag, or when a listed story no longer exists.
 *
 * The list is deliberately short: the main screenshots of each template family (the `vrt-full`
 * stories). Add a line when a new template family gets main stories.
 *
 * Usage: node scripts/check-story-tags.mjs   (exit code 1 on problems)
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** title → story names that must carry `tag`. */
export const EXPECTED_TAGS = [
  { title: 'Templates/Composed pages', tag: 'vrt-full', stories: ['Home', 'About', 'Pricing', 'Contact'] },
  { title: 'Commerce/Templates/Collection', tag: 'vrt-full', stories: ['Default', 'Filtered', 'Empty Collection'] },
  { title: 'Commerce/Templates/Product detail', tag: 'vrt-full', stories: ['Physical With Variants', 'Digital Single File', 'Monthly Subscription'] },
  { title: 'Commerce/Templates/Cart', tag: 'vrt-full', stories: ['Physical', 'Mixed', 'Empty'] },
  { title: 'Commerce/Templates/Checkout', tag: 'vrt-full', stories: ['Mixed Information', 'Mixed Payment', 'Mixed Review', 'Digital Payment'] },
  { title: 'Commerce/Templates/Order confirmation', tag: 'vrt-full', stories: ['Mixed'] },
];

/**
 * Problems for an index.json `entries` object against the expectations. Pure, for unit tests.
 * Also reports stories that carry both vrt-full and vrt-mobile (the harness would pick vrt-full).
 */
export function checkStoryTags(entries, expected = EXPECTED_TAGS) {
  const stories = Object.values(entries).filter((e) => e.type === 'story');
  const problems = [];
  for (const { title, tag, stories: names } of expected) {
    for (const name of names) {
      const story = stories.find((s) => s.title === title && s.name === name);
      if (!story) problems.push(`${title} › ${name}: story not found (renamed? update scripts/check-story-tags.mjs)`);
      else if (!story.tags?.includes(tag)) problems.push(`${title} › ${name}: missing tag "${tag}" (has: ${(story.tags ?? []).join(', ') || 'none'}). Write tags literally on the story; spreads are ignored.`);
    }
  }
  for (const s of stories) {
    if (s.tags?.includes('vrt-full') && s.tags.includes('vrt-mobile')) problems.push(`${s.title} › ${s.name}: has both vrt-full and vrt-mobile; add "!vrt-mobile".`);
  }
  return problems;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const index = join(dirname(fileURLToPath(import.meta.url)), '..', 'storybook-static', 'index.json');
  if (!existsSync(index)) {
    console.error('storybook-static/index.json not found. Run `npm run build-storybook` first.');
    process.exit(1);
  }
  const problems = checkStoryTags(JSON.parse(readFileSync(index, 'utf8')).entries);
  if (problems.length) {
    console.error(`Story tag problems (${problems.length}):\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`Story tags OK (${EXPECTED_TAGS.reduce((n, e) => n + e.stories.length, 0)} expected assignments checked).`);
}
