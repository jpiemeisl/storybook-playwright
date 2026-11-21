import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('docs/content-model.md', () => {
  it('is up to date with the JSDoc in src/content-types and the block examples', () => {
    // Throws (non-zero exit) when the generated file differs; regenerate with `npm run docs:content-model`.
    expect(() => execFileSync(process.execPath, ['scripts/content-model-docs.mjs', '--check'], { stdio: 'pipe' })).not.toThrow();
  });
});
