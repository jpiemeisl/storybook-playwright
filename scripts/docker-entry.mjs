#!/usr/bin/env node
/*
 * Runs inside the Playwright container (started by scripts/docker-run.mjs). Installs dependencies into
 * the node_modules volume with `npm ci` only when package-lock.json changed since the volume was last
 * populated (its hash is stored in the volume), then runs the requested command. No shell strings.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

if (process.env.PW_DOCKER !== '1') {
  console.error('docker-entry.mjs runs inside the container only; use node scripts/docker-run.mjs.');
  process.exit(1);
}

const run = (command, args) => spawnSync(command, args, { stdio: 'inherit' }).status ?? 1;

const stamp = 'node_modules/.lockfile-sha256';
const hash = createHash('sha256').update(readFileSync('package-lock.json')).digest('hex');
const current = existsSync(stamp) ? readFileSync(stamp, 'utf8').trim() : '';
if (current !== hash) {
  console.log(current ? 'package-lock.json changed: running npm ci in the container…' : 'First run in this volume: running npm ci in the container…');
  const status = run('npm', ['ci', '--no-audit', '--no-fund']);
  if (status !== 0) process.exit(status);
  writeFileSync(stamp, `${hash}\n`);
}

const [command, ...args] = process.argv.slice(2);
process.exit(command ? run(command, args) : 0);
