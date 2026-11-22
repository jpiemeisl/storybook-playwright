#!/usr/bin/env node
/*
 * Lists baseline files in tests/visual/__screenshots__ that no test produces: their story is gone or was
 * renamed. Compares the test list from `playwright test --list` (which needs a Storybook build) with the
 * files on disk. Visual tests are named "<Storybook title> / <story name>" and their snapshots
 * "<story id>-<width>[-<theme>].png"; other specs' snapshots are matched by the literal file names in
 * their source. Exits 1 when orphans exist; `--delete` removes them.
 *
 * Limitation: viewports and themes are decided while a test runs, so a file for a width a story no longer
 * captures is not detected here (Playwright fails such a story only when the file is missing, not extra).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
const shots = resolve(root, 'tests', 'visual', '__screenshots__');
const indexPath = resolve(root, 'storybook-static', 'index.json');
if (!existsSync(indexPath)) {
  console.error('storybook-static/index.json not found. Run npm run build-storybook first.');
  process.exit(1);
}

const list = spawnSync(process.execPath, [resolve(root, 'node_modules', '@playwright', 'test', 'cli.js'), 'test', '--list', '--reporter=json'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
if (list.status !== 0) {
  console.error(`playwright test --list failed:\n${list.stderr}`);
  process.exit(1);
}
const report = JSON.parse(list.stdout.slice(list.stdout.indexOf('{')));
const titles = new Set();
const walk = (suite) => {
  for (const spec of suite.specs ?? []) titles.add(spec.title);
  for (const child of suite.suites ?? []) walk(child);
};
for (const suite of report.suites) walk(suite);

const entries = Object.values(JSON.parse(readFileSync(indexPath, 'utf8')).entries).filter((e) => e.type === 'story');
const ids = new Set(entries.filter((e) => titles.has(`${e.title} / ${e.name}`)).map((e) => e.id));

// Snapshot names written literally in other visual specs (e.g. the Legal print capture).
const literal = new Set();
for (const file of readdirSync(resolve(root, 'tests', 'visual')).filter((f) => f.endsWith('.spec.ts'))) {
  for (const m of readFileSync(resolve(root, 'tests', 'visual', file), 'utf8').matchAll(/['"`]([\w.-]+\.png)['"`]/g)) literal.add(m[1]);
}

const orphans = readdirSync(shots).filter((file) => {
  if (literal.has(file)) return false;
  const id = file.replace(/-\d+(-[a-z]+)?\.png$/, '');
  return !ids.has(id);
});

console.log(`${readdirSync(shots).length} baseline files, ${ids.size} stories under test, ${orphans.length} orphan(s).`);
for (const file of orphans) console.log(`  ${file}`);
if (orphans.length && process.argv.includes('--delete')) {
  for (const file of orphans) rmSync(join(shots, file));
  console.log(`Deleted ${orphans.length} orphan(s).`);
} else if (orphans.length) {
  console.error('Orphan baselines found. Review the list, then run node scripts/check-orphan-snapshots.mjs --delete.');
  process.exit(1);
}
