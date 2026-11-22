#!/usr/bin/env node
/*
 * Guard rails for the visual suite. Baselines are rendered in the pinned Linux container
 * (docker/image.json), so:
 *   - writing baselines (`update`, or any --update-snapshots run) is refused in CI, always: CI only
 *     compares; developers update baselines locally in Docker and commit them;
 *   - outside CI it is refused outside the container, unless PW_ALLOW_HOST_UPDATE=1 is set for an
 *     emergency (the override does not apply in CI);
 *   - comparing (`check`) on a non-Linux host prints a warning: small differences are expected there.
 * Used by the npm scripts (node scripts/vrt-guard.mjs update|check), by playwright.config.ts and by
 * scripts/docker-run.mjs.
 */
import { pathToFileURL } from 'node:url';

/** CI providers set CI (GitHub Actions sets CI=true); any value other than empty, "0" or "false" counts. */
export const inCi = (env = process.env) => !!env.CI && env.CI !== '0' && env.CI.toLowerCase() !== 'false';

export const inContainer = (env = process.env) => env.PW_DOCKER === '1';

/** Why baselines must not be written in this environment, or null when writing is allowed. */
export function updateRefusal(env = process.env) {
  if (inCi(env)) {
    return [
      'Refusing to write visual baselines in CI (CI is set). CI only compares against committed baselines.',
      'Update them locally with npm run test:vrt:docker:update and commit them with the change.',
    ].join('\n');
  }
  if (inContainer(env) || env.PW_ALLOW_HOST_UPDATE === '1') return null;
  return [
    'Refusing to write visual baselines outside the Playwright container.',
    'Baselines are rendered in the pinned Linux image so they match on every machine. Run:',
    '  npm run test:vrt:docker:update',
    'Emergency override (baselines from this host will differ from the container): set PW_ALLOW_HOST_UPDATE=1.',
  ].join('\n');
}

/** Throws (with instructions) when baselines would be written in CI or outside the container. */
export function assertCanUpdate(env = process.env) {
  const refusal = updateRefusal(env);
  if (refusal) throw new Error(refusal);
}

/** True when a Playwright argument list asks to write baselines. */
export const isUpdateArgs = (args) => args.some((arg) => arg === '-u' || arg.startsWith('--update-snapshots'));

/** A warning for comparisons on a host that isn't the container's OS. */
export function hostWarning(env = process.env) {
  if (inContainer(env) || process.platform === 'linux') return null;
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
