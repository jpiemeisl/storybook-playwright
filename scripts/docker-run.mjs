#!/usr/bin/env node
/*
 * Runs a command in the pinned Playwright image (docker/image.json), so every screenshot is rendered in
 * the same Linux environment on every machine. Plain Node, no dependencies, no shell: docker is spawned
 * with an argument array, so it behaves the same from PowerShell, cmd and bash.
 *
 *   node scripts/docker-run.mjs --pull               pull the pinned image
 *   node scripts/docker-run.mjs --shell              interactive bash in the container
 *   node scripts/docker-run.mjs <command> [args...]  e.g. npm run test:vrt -- --shard=1/3
 *
 * The repository is bind-mounted at /work. node_modules is a named Docker volume (one per checkout), so
 * Windows- or macOS-built node_modules never enter the container; scripts/docker-entry.mjs runs `npm ci`
 * in it only when package-lock.json changed. Inside, PW_DOCKER=1 is set; PLAYWRIGHT_* variables pass through.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pin = JSON.parse(readFileSync(resolve(root, 'docker', 'image.json'), 'utf8'));
const image = `${pin.image}:${pin.tag}@${pin.digest}`;
const platform = pin.platform ?? 'linux/amd64';
const volume = `storybook-playwright-node-modules-${createHash('sha256').update(root.toLowerCase()).digest('hex').slice(0, 8)}`;

const docker = (args, options = {}) => {
  const result = spawnSync('docker', args, { stdio: 'inherit', ...options });
  if (result.error) {
    console.error(`Could not run docker (${result.error.message}). Install and start Docker Desktop (WSL 2 backend on Windows), Rancher Desktop or Podman; see the README.`);
    process.exit(1);
  }
  return result.status ?? 1;
};

const [first, ...rest] = process.argv.slice(2);
if (!first) {
  console.error('Usage: node scripts/docker-run.mjs --pull | --shell | <command> [args...]');
  process.exit(1);
}
if (first === '--pull') process.exit(docker(['pull', '--platform', platform, image]));

const posix = process.platform !== 'win32';
const user = posix ? [`${process.getuid()}:${process.getgid()}`] : [];

// On Linux and macOS the container runs as the host user, so files it writes (baselines, reports) are
// not root-owned. A fresh named volume is root-owned: hand it to that user first.
if (posix) docker(['run', '--rm', '--platform', platform, '-v', `${volume}:/work/node_modules`, image, 'chown', user[0], '/work/node_modules'], { stdio: 'ignore' });

const interactive = first === '--shell';
const command = interactive ? ['bash'] : [first, ...rest];
const args = [
  'run',
  '--rm',
  '--init',
  '--ipc=host',
  '--platform',
  platform,
  ...(interactive || process.stdin.isTTY ? ['-it'] : []),
  ...(posix ? ['--user', user[0], '-e', 'HOME=/tmp'] : []),
  '-v',
  `${root}:/work`,
  '-v',
  `${volume}:/work/node_modules`,
  '-w',
  '/work',
  '-e',
  'PW_DOCKER=1',
  // Pinned font resolution (see the file): system-ui would otherwise be a CJK font with no bold.
  '-e',
  'FONTCONFIG_FILE=/work/docker/fonts.conf',
  '-e',
  'npm_config_update_notifier=false',
  // Playwright settings from the host (e.g. PLAYWRIGHT_JSON_OUTPUT_NAME).
  ...Object.keys(process.env).filter((name) => name.startsWith('PLAYWRIGHT_')).flatMap((name) => ['-e', `${name}=${process.env[name]}`]),
  image,
  'node',
  'scripts/docker-entry.mjs',
  ...command,
];
process.exit(docker(args));
