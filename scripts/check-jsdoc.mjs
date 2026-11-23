#!/usr/bin/env node
/*
 * npm run check:jsdoc (after npm run build:lib): every public export (the names docs/api-surface.md lists,
 * from the core and commerce entry points) has a JSDoc summary line on its declaration. The summary is
 * what editors show on hover and what Storybook's autodocs use for components. Reads the built .d.ts
 * files, which keep the JSDoc tsc copied from the source; fix a finding in the source file.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { moduleExports } from './api-report.mjs';

/**
 * The summary line of the JSDoc directly above the declaration of `name` in a .d.ts file, '' when the
 * JSDoc has no summary (only tags), or null when there is no JSDoc or no declaration.
 */
export function summaryFor(text, name) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const decl = new RegExp(`^(?:export\\s+)?(?:declare\\s+)?(?:abstract\\s+)?(?:function|const|let|class|interface|type|enum|namespace)\\s+${name.replace(/\$/g, '\\$')}\\b`);
  const index = lines.findIndex((line) => decl.test(line));
  if (index < 0) return null;
  let end = index - 1;
  while (end >= 0 && !lines[end].trim()) end--;
  if (end < 0 || !lines[end].trim().endsWith('*/')) return null;
  let start = end;
  while (start >= 0 && !lines[start].trim().startsWith('/**')) start--;
  if (start < 0) return null;
  const body = lines
    .slice(start, end + 1)
    .join('\n')
    .replace(/^\s*\/\*\*/, '')
    .replace(/\*\/\s*$/, '')
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, '').trim());
  const summary = [];
  for (const line of body) {
    if (line.startsWith('@')) break;
    if (line) summary.push(line);
    else if (summary.length) break;
  }
  return summary.join(' ');
}

/** Public exports without a summary: [{ entry, name, kind, origin }], one row per declaration. */
export function missingSummaries(entries, readFile) {
  const seen = new Set();
  const missing = [];
  for (const { entry, exports } of entries) {
    for (const [name, info] of exports) {
      const key = `${info.origin}#${info.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const text = info.origin ? readFile(info.origin) : null;
      const summary = text == null ? null : summaryFor(text, info.name ?? name);
      if (!summary) missing.push({ entry, name, kind: info.kind, origin: info.origin });
    }
  }
  return missing;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const dist = resolve(process.cwd(), 'dist');
  if (!existsSync(resolve(dist, 'types', 'index.d.ts'))) {
    console.error('dist/types/index.d.ts is missing. Run npm run build:lib first.');
    process.exit(1);
  }
  const readFile = (path) => (existsSync(resolve(dist, path)) ? readFileSync(resolve(dist, path), 'utf8') : null);
  const cache = new Map();
  const entries = [
    { entry: 'core', exports: moduleExports('types/index.d.ts', readFile, cache) },
    { entry: 'commerce', exports: moduleExports('types/commerce/index.d.ts', readFile, cache) },
  ];
  const total = entries.reduce((n, e) => n + e.exports.size, 0);
  const missing = missingSummaries(entries, readFile);
  if (missing.length) {
    const source = (origin) => `src/${origin.replace(/^types\//, '').replace(/\.d\.ts$/, '')}.ts(x)`;
    for (const m of missing) console.error(`  ${m.entry.padEnd(8)} ${m.kind.padEnd(9)} ${m.name.padEnd(36)} ${source(m.origin ?? '?')}`);
    console.error(`\ncheck:jsdoc: ${missing.length} public export(s) have no JSDoc summary. Add a /** one-line summary */ above each declaration in the source.`);
    process.exit(1);
  }
  console.log(`JSDoc OK: all ${total} public exports (core and commerce) have a summary line.`);
}
