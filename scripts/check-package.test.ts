import { describe, expect, it } from 'vitest';
import { checkExports, checkFiles, REQUIRED } from './check-package.mjs';

const good = [...REQUIRED, 'dist/core.js', 'dist/core.css', 'dist/commerce.js', 'dist/commerce.css', 'dist/tokens/index.css', 'dist/tokens/themes/harbor.css', 'dist/types/index.d.ts', 'dist/types/components/Button/Button.d.ts'];

describe('check-package', () => {
  it('accepts the build output, README, CHANGELOG and docs/consuming.md', () => {
    expect(checkFiles(good)).toEqual([]);
  });

  it.each([
    ['src/components/Button/Button.tsx', 'source files'],
    ['tests/visual/stories.spec.ts', 'tests'],
    ['dist/__screenshots__/button.png', 'visual baselines'],
    ['dist/types/components/Button/Button.stories.d.ts', 'stories'],
    ['dist/types/fixtures/pages.d.ts', 'fixtures'],
    ['dist/fixtures/products.json', 'fixtures'],
    ['demo/main.tsx', 'the demo app'],
    ['scripts/check-package.mjs', 'scripts'],
    ['.storybook/main.ts', 'Storybook config'],
    ['storybook-static/index.html', 'the Storybook build'],
    ['docker/image.json', 'Docker files'],
    ['.npmrc', 'environment or registry config'],
  ])('refuses %s (%s)', (path, reason) => {
    expect(checkFiles([...good, path])).toEqual([`${path} would ship (${reason})`]);
  });

  it('refuses files outside the allowlist, such as build bookkeeping', () => {
    expect(checkFiles([...good, 'dist/core.modules.json'])).toEqual(['dist/core.modules.json would ship but is not in the allowlist (scripts/check-package.mjs)']);
    expect(checkFiles([...good, 'docs/testing.md'])).toHaveLength(1);
  });

  it('requires README, CHANGELOG and docs/consuming.md', () => {
    expect(checkFiles(good.filter((p) => p !== 'CHANGELOG.md'))).toEqual(['CHANGELOG.md is missing from the package']);
  });

  it('checks that every exports-map target ships', () => {
    const exportsMap = { '.': { types: './dist/types/index.d.ts', import: './dist/core.js' }, './tokens/*': './dist/tokens/*', './commerce.css': './dist/commerce.css' };
    expect(checkExports(exportsMap, good)).toEqual([]);
    expect(checkExports({ ...exportsMap, './missing.css': './dist/missing.css' }, good)).toEqual(['exports["./missing.css"] points to ./dist/missing.css, which would not ship']);
    expect(checkExports({ './x/*': './dist/x/*.js' }, good)).toEqual(['exports["./x/*"] (./dist/x/*.js) matches no packed file']);
  });
});
