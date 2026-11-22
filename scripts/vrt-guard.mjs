#!/usr/bin/env node
/*
 * Guard rails for the visual suite. Baselines are rendered in the pinned Linux container
 * (docker/image.json), so:
 *   - writing baselines (`update`, or any --update-snapshots run) is refused outside the container,
 *     unless PW_ALLOW_HOST_UPDATE=1 is set for an emergency;
 *   - comparing (`check`) on a non-Linux host prints a warning: small differences are expected there.
 * Used by the npm scripts (node scripts/vrt-guard.mjs update|check) and by playwright.config.ts.
 */
import { pathToFileURL } from 'node:url';

export const inContainer = () => process.env.PW_DOCKER === '1';

/** Throws (with instructions) when baselines would be written outside the container. */
export function assertCanUpdate() {
  if (inContainer() || process.env.PW_ALLOW_HOST_UPDATE === '1') return;
  throw new Error(
    [
      'Refusing to write visual baselines outside the Playwright container.',
      'Baselines are rendered in the pinned Linux image so they match on every machine. Run:',
      '  npm run test:vrt:docker:update',
      'Emergency override (baselines from this host will differ from the container): set PW_ALLOW_HOST_UPDATE=1.',
    ].join('\n'),
  );
}

/** A warning for comparisons on a host that isn't the container's OS. */
export function hostWarning() {
  if (inContainer() || process.platform === 'linux') return null;
  return `Note: baselines are rendered in the Linux container. On ${process.platform} expect small font and anti-aliasing differences; use npm run test:vrt:docker for a trustworthy result.`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const mode = process.argv[2];
  if (mode === 'update') {
    try {
      assertCanUpdate();
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  } else if (mode === 'check') {
    const warning = hostWarning();
    if (warning) console.warn(`\n${warning}\n`);
  } else {
    console.error('Usage: node scripts/vrt-guard.mjs update|check');
    process.exit(1);
  }
}
