import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertCanUpdate, inCi, isUpdateArgs, updateRefusal } from './vrt-guard.mjs';

const root = resolve(import.meta.dirname, '..');
/** Runs a script with a controlled environment (no inherited CI or PW_* variables). */
const run = (args: string[], env: Record<string, string>) =>
  spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', env: { PATH: process.env.PATH ?? '', SystemRoot: process.env.SystemRoot ?? '', ...env } });

describe('vrt-guard', () => {
  it('detects CI from the CI variable', () => {
    expect(inCi({ CI: 'true' })).toBe(true);
    expect(inCi({ CI: '1' })).toBe(true);
    expect(inCi({})).toBe(false);
    expect(inCi({ CI: '' })).toBe(false);
    expect(inCi({ CI: 'false' })).toBe(false);
    expect(inCi({ CI: '0' })).toBe(false);
  });

  it('refuses baseline updates in CI, even in the container and with the host override', () => {
    const env = { CI: 'true', PW_DOCKER: '1', PW_ALLOW_HOST_UPDATE: '1' };
    expect(updateRefusal(env)).toMatch(/in CI/);
    expect(() => assertCanUpdate(env)).toThrow(/in CI/);
  });

  it('allows updates in the container and with the override outside CI', () => {
    expect(updateRefusal({ PW_DOCKER: '1' })).toBeNull();
    expect(updateRefusal({ PW_ALLOW_HOST_UPDATE: '1' })).toBeNull();
    expect(updateRefusal({})).toMatch(/outside the Playwright container/);
  });

  it('recognises update arguments', () => {
    expect(isUpdateArgs(['test', '-u'])).toBe(true);
    expect(isUpdateArgs(['test', '--update-snapshots=all'])).toBe(true);
    expect(isUpdateArgs(['test', '--shard=1/4'])).toBe(false);
  });

  it('the update script exits non-zero in CI', () => {
    const result = run(['scripts/vrt-guard.mjs', 'update'], { CI: 'true', PW_DOCKER: '1', PW_ALLOW_HOST_UPDATE: '1' });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/in CI/);
  });

  it('the Docker runner refuses update commands in CI before starting a container', () => {
    for (const command of [['npm', 'run', 'test:vrt:update', '--'], ['npx', 'playwright', 'test', '--update-snapshots']]) {
      const result = run(['scripts/docker-run.mjs', ...command], { CI: 'true' });
      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(/in CI/);
    }
  });
});
