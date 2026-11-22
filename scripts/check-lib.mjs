#!/usr/bin/env node
/*
 * Verifies the library build in dist/ (run npm run build:lib first). Fails when:
 *   - the core bundle contains commerce, demo, fixture or story modules
 *   - the commerce bundle contains core or demo modules (core must come from the package entry), or
 *     imports a name the core entry doesn't export
 *   - either bundle contains localStorage, sessionStorage, document.cookie or fetch(
 *   - a runtime export has no type declaration
 * Reports bundle sizes (raw and gzip) per entry.
 */
import { existsSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, resolve } from 'node:path';

const dist = resolve(process.cwd(), 'dist');
const PACKAGE = 'storybook-playwright';
const problems = [];
const fail = (message) => problems.push(message);

for (const file of ['core.js', 'commerce.js', 'core.css', 'core.modules.json', 'commerce.modules.json', 'types/index.d.ts', 'types/commerce/index.d.ts']) {
  if (!existsSync(resolve(dist, file))) {
    console.error(`dist/${file} is missing. Run npm run build:lib first.`);
    process.exit(1);
  }
}

const read = (file) => readFileSync(resolve(dist, file), 'utf8');
const modules = { core: JSON.parse(read('core.modules.json')), commerce: JSON.parse(read('commerce.modules.json')) };
const leak = (id) => /^(demo\/|src\/fixtures\/|src\/commerce\/fixtures\/|src\/stories\/)|\.stories\.tsx?$|\.test\.tsx?$/.test(id);

// 1. Module boundaries.
for (const id of modules.core) {
  if (id.startsWith('src/commerce/')) fail(`core bundle contains commerce module ${id}`);
  if (leak(id)) fail(`core bundle contains ${id}`);
}
for (const id of modules.commerce) {
  if (!id.startsWith('src/commerce/') && !id.endsWith('.css') && !id.startsWith('node_modules/')) fail(`commerce bundle contains non-commerce module ${id} (core must stay external)`);
  if (leak(id)) fail(`commerce bundle contains ${id}`);
}

// 2. Exports and imports.
const exportsOf = (code) => {
  const names = new Set();
  for (const m of code.matchAll(/export\s*\{([^}]*)\}/g)) for (const part of m[1].split(',')) if (part.trim()) names.add(part.trim().split(/\s+as\s+/).pop());
  for (const m of code.matchAll(/export\s+(?:const|function|class|let)\s+([\w$]+)/g)) names.add(m[1]);
  return names;
};
const code = { core: read('core.js'), commerce: read('commerce.js') };
const coreExports = exportsOf(code.core);
const commerceExports = exportsOf(code.commerce);
const fromCore = [...code.commerce.matchAll(new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*["']${PACKAGE}["']`, 'g'))].flatMap((m) => m[1].split(',').map((p) => p.trim().split(/\s+as\s+/)[0]).filter(Boolean));
if (fromCore.length === 0) fail('commerce bundle does not import the core entry');
for (const name of new Set(fromCore)) if (!coreExports.has(name)) fail(`commerce imports "${name}" from core, but core does not export it`);

// 3. Forbidden browser APIs.
for (const [entry, text] of Object.entries(code)) {
  for (const pattern of [/\blocalStorage\b/, /\bsessionStorage\b/, /document\.cookie/, /\bfetch\(/]) if (pattern.test(text)) fail(`${entry} bundle uses ${pattern.source.replace(/\\b|\\/g, '')}`);
}

// 4. Every runtime export has a declaration (types-only exports exist only in the .d.ts, which is fine).
/** Names a .d.ts file exports, following export * and export { } from chains. */
function declaredNames(file, seen = new Set()) {
  const names = new Set();
  const path = [file, file.replace(/\.d\.ts$/, '/index.d.ts')].find((p) => existsSync(p));
  if (!path || seen.has(path)) return names;
  seen.add(path);
  const text = readFileSync(path, 'utf8');
  const target = (spec) => resolve(dirname(path), spec.replace(/\.js$/, '')) + '.d.ts';
  for (const m of text.matchAll(/export\s+(?:declare\s+)?(?:abstract\s+)?(?:const|function|class|type|interface|enum|let|namespace)\s+([\w$]+)/g)) names.add(m[1]);
  for (const m of text.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) for (const part of m[1].split(',')) if (part.trim()) names.add(part.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop());
  for (const m of text.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g)) for (const n of declaredNames(target(m[1]), seen)) names.add(n);
  return names;
}
for (const [entry, names, file] of [['core', coreExports, 'types/index.d.ts'], ['commerce', commerceExports, 'types/commerce/index.d.ts']]) {
  const types = declaredNames(resolve(dist, file));
  for (const name of names) if (!types.has(name)) fail(`${entry} exports "${name}" without a declaration in dist/${file}`);
}

// 5. Sizes.
const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
const rows = ['core.js', 'core.css', 'commerce.js', 'commerce.css'].filter((f) => existsSync(resolve(dist, f))).map((file) => {
  const buffer = readFileSync(resolve(dist, file));
  return `  ${file.padEnd(13)} ${kb(buffer.length).padStart(10)}  gzip ${kb(gzipSync(buffer).length).padStart(9)}`;
});
console.log(`Bundles (modules: core ${modules.core.length}, commerce ${modules.commerce.length}; exports: core ${coreExports.size}, commerce ${commerceExports.size}; commerce imports ${new Set(fromCore).size} names from core):`);
console.log(rows.join('\n'));

if (problems.length) {
  console.error(`\ncheck:lib found ${problems.length} problem(s):\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  process.exit(1);
}
console.log('\nLibrary OK: no commerce, demo or fixture code in core; commerce imports core as an external; no storage, cookie or fetch use; every export declared.');
