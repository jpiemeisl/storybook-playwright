import { describe, expect, it } from 'vitest';
import {
  anchors,
  checkedBlocks,
  checkLinks,
  checkOrphans,
  checkPaths,
  checkScripts,
  checkStale,
  checkVersions,
  externalLinks,
  links,
  repoPath,
  scanLines,
  slug,
} from './check-docs.mjs';

const files: Record<string, string> = {
  'docs/testing.md': '# Testing\n\n## Updating baselines\n\n## Updating baselines\n\n### `npm run test:vrt:docker`\n',
  'docs/ci.md': '# CI\n',
  'README.md': '# Readme\n',
};
const exists = (p: string) => p in files || ['src', 'src/index.ts', 'docs', 'scripts/check-docs.mjs'].includes(p);
const read = (p: string) => files[p] ?? null;

describe('check-docs', () => {
  it('builds GitHub heading slugs', () => {
    expect(slug('Updating baselines')).toBe('updating-baselines');
    expect(slug('Visual testing with Docker')).toBe('visual-testing-with-docker');
    expect(slug('`npm run test:vrt:docker`')).toBe('npm-run-testvrtdocker');
    expect(slug('Composed: `default`, `home`, `about`')).toBe('composed-default-home-about');
    expect(slug('Steps by cart kind (physical, digital)')).toBe('steps-by-cart-kind-physical-digital');
    expect(slug('Host versus container — why')).toBe('host-versus-container--why');
    expect(slug('**Bold** and [a link](x.md)')).toBe('bold-and-a-link');
    expect(slug('snake_case stays')).toBe('snake_case-stays');
    expect(slug('Ünïcödé letters')).toBe('ünïcödé-letters');
  });

  it('numbers duplicate anchors like GitHub and ignores headings in code', () => {
    expect([...anchors(files['docs/testing.md']!)]).toEqual(['testing', 'updating-baselines', 'updating-baselines-1', 'npm-run-testvrtdocker']);
    expect(anchors('```md\n# Not a heading\n```\n# Real').has('not-a-heading')).toBe(false);
  });

  it('tracks fenced code', () => {
    const lines = scanLines('a\n```tsx check\ncode\n```\nb');
    expect(lines.map((l) => l.inFence)).toEqual([false, true, true, true, false]);
    expect(lines[1]!.info).toBe('tsx check');
  });

  it('finds links outside inline code', () => {
    expect(links('See [testing](docs/testing.md#updating-baselines) and ![shot](a.png) but not `[x](y.md)`.')).toEqual([
      { target: 'docs/testing.md#updating-baselines', image: false },
      { target: 'a.png', image: true },
    ]);
    expect(links('[ref]: docs/ci.md')).toEqual([{ target: 'docs/ci.md', image: false }]);
  });

  it('reports broken relative links and anchors', () => {
    const doc = { file: 'README.md', text: '[ok](docs/testing.md#updating-baselines-1) [missing](docs/nope.md) [bad anchor](docs/ci.md#jobs) [self](#readme) [ext](https://example.com/x) [up](../outside.md)' };
    expect(checkLinks(doc, { exists, read }).map((p) => p.message)).toEqual([
      'docs/nope.md: docs/nope.md does not exist',
      'docs/ci.md#jobs: no heading with the anchor #jobs in docs/ci.md',
      '../outside.md points outside the repository; use an absolute URL',
    ]);
    expect(checkLinks({ file: 'docs/ci.md', text: '[t](testing.md) [r](../README.md#readme)' }, { exists, read })).toEqual([]);
  });

  it('reports npm scripts that do not exist', () => {
    const doc = { file: 'README.md', text: 'Run `npm run check:all`, then npm run test:vrt:docker.\n```sh\nnpm run nope -- --x\n```' };
    expect(checkScripts(doc, { scripts: new Set(['check:all', 'test:vrt:docker']) }).map((p) => [p.line, p.message])).toEqual([[3, 'npm run nope: package.json has no "nope" script']]);
    expect(checkScripts({ file: 'x.md', text: 'npm run build' }, { scripts: new Set(), allowed: new Set(['build']) })).toEqual([]);
  });

  it('recognizes repository paths and skips placeholders', () => {
    expect(repoPath('src/index.ts')).toBe('src/index.ts');
    expect(repoPath('./docs/')).toBe('docs');
    expect(repoPath('scripts/check-docs.mjs:12')).toBe('scripts/check-docs.mjs');
    expect(repoPath('src/adapters/<cms>/')).toBeNull();
    expect(repoPath('src/**/*.stories.tsx')).toBeNull();
    expect(repoPath('src/components/...')).toBeNull();
    expect(repoPath('npm run x')).toBeNull();
    expect(repoPath('app/providers.tsx')).toBeNull();
  });

  it('reports missing repository paths in inline code, honoring the allowlist', () => {
    const doc = { file: 'README.md', text: 'See `src/index.ts`, `src/gone.ts` and `docs/later.md`.\n```\nsrc/in-a-fence.ts\n```' };
    expect(checkPaths(doc, { exists, allowed: new Set(['docs/later.md']) }).map((p) => p.message)).toEqual([
      '`src/gone.ts`: src/gone.ts does not exist (or add it to scripts/check-docs.allow.json with a reason)',
    ]);
  });

  it('extracts only blocks tagged check', () => {
    const md = 'x\n```tsx check\nconst a = 1;\nconst b = 2;\n```\n```tsx\nnot checked\n```\n```ts check\nlet c;\n```';
    expect(checkedBlocks(md)).toEqual([
      { line: 3, lang: 'tsx', code: 'const a = 1;\nconst b = 2;' },
      { line: 10, lang: 'ts', code: 'let c;' },
    ]);
  });

  it('reports stale phrases outside fences, skipping history files', () => {
    const entries = [
      { pattern: 'not published', reason: 'it is published' },
      { pattern: '\\bcolour\\b', reason: 'US English: color', ignore: ['docs/legacy.md'] },
    ];
    const text = 'The package is not published.\nPick a colour.\n```\nnot published\n```';
    expect(checkStale({ file: 'README.md', text }, entries).map((p) => [p.line, p.message])).toEqual([
      [1, '"not published": it is published'],
      [2, '"colour": US English: color'],
    ]);
    expect(checkStale({ file: 'CHANGELOG.md', text }, entries)).toEqual([]);
    expect(checkStale({ file: 'docs/legacy.md', text: 'colour' }, entries)).toEqual([]);
  });

  it('reports docs the index does not link', () => {
    const index = '- [Testing](testing.md)\n- [CI](ci.md#jobs)';
    expect(checkOrphans(['README.md', 'docs/README.md', 'docs/testing.md', 'docs/ci.md', 'docs/theming.md'], index).map((p) => p.file)).toEqual(['docs/theming.md']);
  });

  it('reports hard-coded versions in prose unless marked', () => {
    const current: [string, string][] = [['0.1.0', 'the package version']];
    const text = [
      'Requires Node 26.',
      'Uses Playwright 1.65 and Storybook 10.',
      '0.1.0 is out.',
      'Pin ~0.1.0 until 1.0.0; a breaking change bumps 0.2.0.',
      'WCAG 1.4.3 contrast.',
      'Released 0.1.0 on day one. <!-- check-docs: version-ok -->',
      '```sh\nnpm install @jpiemeisl/pattern-library@0.1.0\n```',
    ].join('\n');
    expect(checkVersions({ file: 'README.md', text }, current).map((p) => [p.line, p.message.split('"')[1]])).toEqual([
      [1, 'Node 26'],
      [2, 'Playwright 1.65'],
      [3, '0.1.0'],
      [4, '0.1.0'],
    ]);
    expect(checkVersions({ file: 'CHANGELOG.md', text }, current)).toEqual([]);
  });

  it('collects external links', () => {
    expect(externalLinks('README.md', '[a](https://github.com/x) [b](docs/ci.md) <https://not-a-link-form>')).toEqual([{ file: 'README.md', line: 1, url: 'https://github.com/x' }]);
  });
});
