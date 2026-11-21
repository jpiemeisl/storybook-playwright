import { describe, expect, it } from 'vitest';
import { checkStoryTags } from './check-story-tags.mjs';

const story = (title: string, name: string, tags: string[]) => ({ type: 'story', title, name, tags });
const expected = [{ title: 'T', tag: 'vrt-full', stories: ['Main'] }];

describe('checkStoryTags', () => {
  it('passes when the expected tag is present', () => {
    expect(checkStoryTags({ a: story('T', 'Main', ['dev', 'vrt-full']) }, expected)).toEqual([]);
  });

  it('reports a missing tag (the spread-tags bug) and a missing story', () => {
    expect(checkStoryTags({ a: story('T', 'Main', ['dev', 'vrt-mobile']) }, expected)[0]).toMatch(/missing tag "vrt-full"/);
    expect(checkStoryTags({}, expected)[0]).toMatch(/story not found/);
  });

  it('reports stories with both vrt-full and vrt-mobile and ignores docs entries', () => {
    const entries = { a: story('T', 'Main', ['vrt-full', 'vrt-mobile']), d: { type: 'docs', title: 'T', name: 'Docs', tags: ['vrt-full', 'vrt-mobile'] } };
    expect(checkStoryTags(entries, expected)).toEqual(['T › Main: has both vrt-full and vrt-mobile; add "!vrt-mobile".']);
  });
});
