#!/usr/bin/env node
/*
 * prepublishOnly: npm publish is refused unless the release workflow runs it (.github/workflows/release.yml
 * sets RELEASE_WORKFLOW=1). Together with publishConfig.registry (GitHub Packages only), this stops an
 * accidental `npm publish` from a laptop. See docs/publishing.md.
 */
if (process.env.RELEASE_WORKFLOW !== '1') {
  console.error(
    [
      '',
      'Refusing to publish: this package is published only by the release workflow (.github/workflows/release.yml).',
      'To release, run npm run release:prepare on a release branch, merge it, then npm run release:tag on main.',
      'See docs/publishing.md.',
      '',
    ].join('\n'),
  );
  process.exit(1);
}
