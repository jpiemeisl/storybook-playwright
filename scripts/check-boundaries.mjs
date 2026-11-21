#!/usr/bin/env node
/*
 * Import boundary check (plain Node, no dependencies). Fails when:
 *   (a) a file outside src/commerce/ and demo/ imports from src/commerce/
 *   (b) a barrel (index.ts/tsx/js) under src/ re-exports from demo/
 *   (c) any file under src/ imports from demo/
 * Usage: node scripts/check-boundaries.mjs   (exit code 1 on violations)
 * The matching functions are exported for unit tests.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_EXTENSIONS = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
/** The unit tests for this script contain example import statements as strings. */
const SKIP_FILES = new Set(['scripts/check-boundaries.test.ts']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'storybook-static', 'test-results', 'playwright-report', 'dist', 'coverage']);

/** Module specifiers in a source file: static imports and re-exports, side-effect imports, import() and require(). */
export function findSpecifiers(source) {
  const found = [];
  const patterns = [
    /\b(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,$]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) for (const match of source.matchAll(pattern)) found.push({ specifier: match[1], reexport: /^export\b/.test(match[0]) });
  return found;
}

/** Repo-relative POSIX path a relative specifier points at; null for package imports. */
export function resolveSpecifier(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  return posix.normalize(posix.join(posix.dirname(fromFile), specifier));
}

const inside = (path, dir) => path === dir || path.startsWith(`${dir}/`);
const isBarrel = (path) => /(^|\/)index\.(ts|tsx|js|mjs)$/.test(path);

/** Violations for one file (repo-relative POSIX path) given its source. */
export function checkFile(file, source) {
  const violations = [];
  for (const { specifier, reexport } of findSpecifiers(source)) {
    const target = resolveSpecifier(file, specifier);
    if (!target) continue;
    if (inside(target, 'src/commerce') && !inside(file, 'src/commerce') && !inside(file, 'demo')) {
      violations.push({ file, specifier, rule: 'a', message: 'only src/commerce and demo may import from src/commerce' });
    }
    if (inside(target, 'demo') && inside(file, 'src')) {
      const barrel = reexport && isBarrel(file);
      violations.push({ file, specifier, rule: barrel ? 'b' : 'c', message: barrel ? 'barrels under src/ must not re-export from demo/' : 'nothing under src/ may import from demo/' });
    }
  }
  return violations;
}

/** Every source file under `root`, as repo-relative POSIX paths. */
export function listSourceFiles(root, dir = root) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) files.push(...listSourceFiles(root, join(dir, entry.name)));
    } else if (SOURCE_EXTENSIONS.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(relative(root, join(dir, entry.name)).split(sep).join('/'));
    }
  }
  return files;
}

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const files = listSourceFiles(root).filter((file) => !SKIP_FILES.has(file));
  const violations = files.flatMap((file) => checkFile(file, readFileSync(join(root, file), 'utf8')));
  if (violations.length) {
    for (const v of violations) console.error(`(${v.rule}) ${v.file}: imports "${v.specifier}" - ${v.message}`);
    console.error(`\n${violations.length} boundary violation(s).`);
    process.exit(1);
  }
  console.log(`Boundaries OK (${files.length} files checked).`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
