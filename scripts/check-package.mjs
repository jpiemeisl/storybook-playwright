#!/usr/bin/env node
/*
 * npm run check:package (after npm run build:lib): what `npm pack` would put in the published package.
 * Runs `npm pack --dry-run --json` and fails when
 *   - any file outside the allowlist below would ship (source, tests, stories, baselines, fixtures, demo,
 *     scripts, Storybook config or build, Docker files, build bookkeeping such as dist/*.modules.json);
 *   - a target of the package.json exports map would not ship;
 *   - package.json, README.md, CHANGELOG.md or docs/consuming.md would be missing.
 * Reports the packed size and the file count. In GitHub Actions it also writes the file list to the job
 * summary. No dependencies: plain Node and npm.
 */
import { execSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Every file the package may contain. Anything else fails the check. */
export const ALLOWED = [
  /^package\.json$/,
  /^README\.md$/,
  /^CHANGELOG\.md$/,
  /^docs\/consuming\.md$/,
  /^dist\/(core|commerce)\.(js|css)$/,
  /^dist\/tokens\/[\w-]+\.css$/,
  /^dist\/tokens\/themes\/[\w-]+\.css$/,
  /^dist\/types\/[\w/.-]+\.d\.ts$/,
];

/** Paths that must never ship even when an allowlist pattern would match, with the reason shown. */
export const FORBIDDEN = [
  [/(^|\/)src\//, 'source files'],
  [/(^|\/)tests?\//, 'tests'],
  [/\.(test|spec)\.|(^|\/)__tests__\//, 'unit tests'],
  [/\.stories\.|(^|\/)stories\//, 'stories'],
  [/__screenshots__|\.png$/, 'visual baselines'],
  [/(^|\/)fixtures?\//, 'fixtures'],
  [/(^|\/)demo\//, 'the demo app'],
  [/(^|\/)scripts\//, 'scripts'],
  [/(^|\/)\.storybook\//, 'Storybook config'],
  [/(^|\/)storybook-static\//, 'the Storybook build'],
  [/(^|\/)docker\//, 'Docker files'],
  [/(^|\/)\.(env|npmrc)/, 'environment or registry config'],
];

/** Files every published version must contain. */
export const REQUIRED = ['package.json', 'README.md', 'CHANGELOG.md', 'docs/consuming.md'];

/** Problems with a list of packed paths: forbidden files, and files no allowlist pattern matches. */
export function checkFiles(paths) {
  const problems = [];
  for (const path of paths) {
    const forbidden = FORBIDDEN.find(([pattern]) => pattern.test(path));
    if (forbidden) problems.push(`${path} would ship (${forbidden[1]})`);
    else if (!ALLOWED.some((pattern) => pattern.test(path))) problems.push(`${path} would ship but is not in the allowlist (scripts/check-package.mjs)`);
  }
  for (const path of REQUIRED) if (!paths.includes(path)) problems.push(`${path} is missing from the package`);
  return problems;
}

/** Problems with the exports map: targets (files, or wildcard patterns) that no packed file provides. */
export function checkExports(exportsMap, paths) {
  const problems = [];
  const set = new Set(paths);
  for (const [subpath, target] of Object.entries(exportsMap ?? {})) {
    const files = typeof target === 'string' ? [target] : Object.values(target);
    for (const file of files) {
      const path = file.replace(/^\.\//, '');
      if (path.includes('*')) {
        const [prefix, suffix] = path.split('*');
        if (!paths.some((p) => p.startsWith(prefix) && p.endsWith(suffix))) problems.push(`exports["${subpath}"] (${file}) matches no packed file`);
      } else if (!set.has(path)) problems.push(`exports["${subpath}"] points to ${file}, which would not ship`);
    }
  }
  return problems;
}

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;

/** Markdown for the job summary. */
export function summaryMarkdown(pack) {
  const lines = [`## Package contents: ${pack.name}@${pack.version}`, '', `${pack.entryCount} files, ${kb(pack.size)} packed, ${kb(pack.unpackedSize)} unpacked.`, ''];
  lines.push('<details><summary>Files</summary>', '', '```');
  for (const file of pack.files) lines.push(`${kb(file.size).padStart(10)}  ${file.path}`);
  lines.push('```', '', '</details>', '');
  return lines.join('\n');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
  // --ignore-scripts: packing must not run lifecycle scripts. A fixed command string, no user input.
  const output = execSync('npm pack --dry-run --json --ignore-scripts', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  const [pack] = JSON.parse(output);
  const paths = pack.files.map((file) => file.path.replaceAll('\\', '/'));
  const problems = [...checkFiles(paths), ...checkExports(pkg.exports, paths)];

  console.log(`${pack.name}@${pack.version}: ${pack.entryCount} files, ${kb(pack.size)} packed, ${kb(pack.unpackedSize)} unpacked.`);
  const byTop = {};
  for (const path of paths) {
    const key = path.startsWith('dist/types/') ? 'dist/types/**/*.d.ts' : path;
    byTop[key] = (byTop[key] ?? 0) + 1;
  }
  for (const [key, count] of Object.entries(byTop)) console.log(`  ${key}${count > 1 ? ` (${count} files)` : ''}`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMarkdown(pack));

  if (problems.length) {
    console.error(`\ncheck:package found ${problems.length} problem(s):\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    console.error('\nOnly the build output, README, CHANGELOG and docs/consuming.md may ship. Fix package.json "files" (or the allowlist, deliberately).');
    process.exit(1);
  }
  console.log('\nPackage OK: only allowlisted files would ship, and every exports-map target is included.');
}
