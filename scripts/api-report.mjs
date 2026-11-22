#!/usr/bin/env node
/*
 * Public API report (after npm run build:lib).
 *   npm run api:report   writes docs/api-surface.md
 *   npm run check:api    fails when docs/api-surface.md differs from what the current build produces
 * Reads the built declaration entry points (dist/types/index.d.ts for core, dist/types/commerce/index.d.ts
 * for commerce), follows every export chain, and lists each exported name with its kind (component,
 * function, class, constant, type). Adds the package's subpath exports, the CSS layer names, the theme names
 * and the semantic custom properties of the default theme. Any change to the public API therefore shows up
 * as a diff of docs/api-surface.md in the pull request (docs/versioning.md says what counts as public API).
 * No dependencies: the .d.ts files tsc emits are regular enough to read line by line.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { posix, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PASCAL = /^[A-Z]/;
const REACT_RETURN = /JSX\.Element|ReactNode|ReactElement|ReactPortal/;
const COMPONENT_TYPE = /ComponentType|ExoticComponent|\bFC\b|FunctionComponent|JSX\.Element|ReactNode|ReactElement/;

/**
 * Splits a declaration file into top-level statements. tsc writes every top-level statement (and every
 * JSDoc block) from column 0 and indents everything nested, so a line starting with one of these words
 * begins a new statement.
 */
export function statements(text) {
  const out = [];
  let current = [];
  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    if (/^(export|declare|import|interface|type|\/\*\*|\/\/)\b|^(\/\*\*|\/\/)/.test(line) && current.length) {
      out.push(current.join('\n'));
      current = [];
    }
    current.push(line);
  }
  if (current.length) out.push(current.join('\n'));
  return out.filter((s) => !/^\s*(\/\*\*|\/\/|$)/.test(s));
}

/** The kind of an exported function declaration. */
export function classifyFunction(name, text) {
  return PASCAL.test(name) && REACT_RETURN.test(text) ? 'component' : 'function';
}

/** The kind of an exported const declaration, from its declared type. */
export function classifyConst(name, text) {
  const type = text.slice(text.indexOf(name) + name.length).replace(/^\s*:\s*/, '').trim();
  if (PASCAL.test(name) && COMPONENT_TYPE.test(type)) return 'component';
  if (/^(<[^>]*>\s*)?\(/.test(type) && /=>/.test(type)) return 'function';
  return 'constant';
}

const parseSpecifiers = (list) =>
  list
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const typeOnly = /^type\s+/.test(part);
      const [imported, local = imported] = part.replace(/^type\s+/, '').split(/\s+as\s+/);
      return { imported, local, typeOnly };
    });

/**
 * Every name a declaration module exports, as Map<name, { kind, typeOnly }>. `readFile(path)` returns the
 * file's text or null; paths are POSIX paths relative to whatever root the caller uses.
 */
export function moduleExports(path, readFile, cache = new Map()) {
  if (cache.has(path)) return cache.get(path);
  const result = new Map();
  cache.set(path, result);
  const text = readFile(path);
  if (text == null) throw new Error(`Cannot read ${path}`);

  const target = (spec) => {
    const base = posix.join(posix.dirname(path), spec.replace(/\.js$/, ''));
    const found = [`${base}.d.ts`, `${base}/index.d.ts`].find((candidate) => readFile(candidate) != null);
    if (!found) throw new Error(`${path}: cannot resolve '${spec}'`);
    return found;
  };
  const add = (name, info) => {
    const existing = result.get(name);
    // A value export wins over a type-only re-export of the same name.
    if (!existing || (existing.typeOnly && !info.typeOnly)) result.set(name, info);
  };

  // Local (non-exported) declarations and imports, for `export { A, B };` without a module specifier.
  const locals = new Map();
  for (const s of statements(text)) {
    let m;
    if ((m = s.match(/^import\s+(type\s+)?\{([^}]*)\}\s+from\s+['"]([^'"]+)['"]/))) {
      for (const spec of parseSpecifiers(m[2])) locals.set(spec.local, { from: m[3], imported: spec.imported, typeOnly: !!m[1] || spec.typeOnly });
    } else if ((m = s.match(/^declare\s+function\s+([\w$]+)/))) locals.set(m[1], { kind: classifyFunction(m[1], s) });
    else if ((m = s.match(/^declare\s+(?:const|let)\s+([\w$]+)/))) locals.set(m[1], { kind: classifyConst(m[1], s) });
    else if ((m = s.match(/^declare\s+(?:abstract\s+)?class\s+([\w$]+)/))) locals.set(m[1], { kind: 'class' });
    else if ((m = s.match(/^(?:declare\s+)?(?:type|interface|enum)\s+([\w$]+)/))) locals.set(m[1], { kind: 'type' });
  }
  const resolveLocal = (name, typeOnly) => {
    const local = locals.get(name);
    if (!local) throw new Error(`${path}: exports '${name}', which it neither declares nor imports`);
    if (local.kind) return { kind: local.kind, typeOnly };
    const info = moduleExports(target(local.from), readFile, cache).get(local.imported);
    if (!info) throw new Error(`${path}: '${local.imported}' is not exported by '${local.from}'`);
    return { kind: info.kind, typeOnly: typeOnly || local.typeOnly || info.typeOnly };
  };

  for (const s of statements(text)) {
    let m;
    if ((m = s.match(/^export\s+declare\s+function\s+([\w$]+)/))) add(m[1], { kind: classifyFunction(m[1], s), typeOnly: false });
    else if ((m = s.match(/^export\s+declare\s+(?:const|let)\s+([\w$]+)/))) add(m[1], { kind: classifyConst(m[1], s), typeOnly: false });
    else if ((m = s.match(/^export\s+declare\s+(?:abstract\s+)?class\s+([\w$]+)/))) add(m[1], { kind: 'class', typeOnly: false });
    else if ((m = s.match(/^export\s+(?:declare\s+)?(?:type|interface|enum)\s+([\w$]+)/))) add(m[1], { kind: 'type', typeOnly: true });
    else if ((m = s.match(/^export\s+(type\s+)?\*\s+as\s+([\w$]+)\s+from/))) add(m[2], { kind: 'namespace', typeOnly: !!m[1] });
    else if ((m = s.match(/^export\s+(type\s+)?\*\s+from\s+['"]([^'"]+)['"]/))) {
      for (const [name, info] of moduleExports(target(m[2]), readFile, cache)) add(name, { kind: info.kind, typeOnly: !!m[1] || info.typeOnly });
    } else if ((m = s.match(/^export\s+(type\s+)?\{([^}]*)\}\s+from\s+['"]([^'"]+)['"]/))) {
      const from = moduleExports(target(m[3]), readFile, cache);
      for (const spec of parseSpecifiers(m[2])) {
        const info = from.get(spec.imported);
        if (!info) throw new Error(`${path}: '${spec.imported}' is not exported by '${m[3]}'`);
        add(spec.local, { kind: info.kind, typeOnly: !!m[1] || spec.typeOnly || info.typeOnly });
      }
    } else if ((m = s.match(/^export\s+(type\s+)?\{([^}]*)\}/))) {
      for (const spec of parseSpecifiers(m[2])) add(spec.local, resolveLocal(spec.imported, !!m[1] || spec.typeOnly));
    }
  }
  return result;
}

const KIND_ORDER = ['component', 'function', 'class', 'constant', 'namespace', 'type'];
const byName = (a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : a < b ? -1 : a > b ? 1 : 0);
/** The label in the report: types are "type"; a value re-exported with `export type` says so. */
export const kindLabel = ({ kind, typeOnly }) => (kind !== 'type' && typeOnly ? `${kind} (type-only export)` : kind);

/** CSS custom properties declared in a stylesheet, in order of first appearance. */
export const customProperties = (css) => [...new Set([...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]))];
/** Layer names from the first `@layer a, b, c;` statement. */
export const layerNames = (css) => (css.match(/@layer\s+([\w\s,-]+);/)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean);

/**
 * The report as Markdown. `entries` is [{ name, specifier, exports: Map }]; `css` is { layers, themes,
 * semantic }; `subpaths` the package.json exports keys.
 */
export function renderReport({ packageName, entries, subpaths, css }) {
  const lines = [
    '# Public API surface',
    '',
    '<!-- Generated by npm run api:report from the library build. Do not edit by hand: npm run check:api fails when this file is out of date. -->',
    '',
    `Everything below is public API of \`${packageName}\` (see [versioning.md](versioning.md)). A pull request that changes this file changes the public API: review it with the version bump in mind.`,
    '',
    '## Package entry points',
    '',
    ...subpaths.map((subpath) => `- \`${subpath === '.' ? packageName : `${packageName}/${subpath.replace(/^\.\//, '')}`}\``),
    '',
  ];
  for (const entry of entries) {
    const names = [...entry.exports.keys()].sort(byName);
    const counts = KIND_ORDER.map((kind) => [kind, names.filter((n) => entry.exports.get(n).kind === kind).length]).filter(([, n]) => n);
    lines.push(`## ${entry.name} (\`${entry.specifier}\`)`, '', `${names.length} exports: ${counts.map(([kind, n]) => `${n} ${kind}${n === 1 ? '' : kind === 'class' ? 'es' : 's'}`).join(', ')}.`, '');
    lines.push('| Name | Kind |', '| --- | --- |');
    for (const name of names) lines.push(`| \`${name}\` | ${kindLabel(entry.exports.get(name))} |`);
    lines.push('');
  }
  lines.push('## CSS', '', `Cascade layers, in order: ${css.layers.map((l) => `\`${l}\``).join(', ')}.`, '');
  lines.push(`Themes (\`data-theme\` values): ${css.themes.map((t) => `\`${t}\``).join(', ')}.`, '');
  lines.push(`Semantic custom properties of the default theme (${css.semantic.length}):`, '');
  for (const property of css.semantic) lines.push(`- \`${property}\``);
  lines.push('');
  return lines.join('\n');
}

/** Lines in `actual` but not in `expected` (+) and the reverse (-), for a short check:api message. */
export function lineDiff(expected, actual) {
  const a = new Set(expected.split('\n'));
  const b = new Set(actual.split('\n'));
  return [...[...a].filter((l) => !b.has(l)).map((l) => `- ${l}`), ...[...b].filter((l) => !a.has(l)).map((l) => `+ ${l}`)];
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const root = process.cwd();
  const dist = resolve(root, 'dist');
  if (!existsSync(resolve(dist, 'types', 'index.d.ts'))) {
    console.error('dist/types/index.d.ts is missing. Run npm run build:lib first.');
    process.exit(1);
  }
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const readFile = (path) => {
    const file = resolve(dist, path);
    return existsSync(file) ? readFileSync(file, 'utf8') : null;
  };
  const cache = new Map();
  const entries = [
    { name: 'Core', specifier: pkg.name, exports: moduleExports('types/index.d.ts', readFile, cache) },
    { name: 'Commerce', specifier: `${pkg.name}/commerce`, exports: moduleExports('types/commerce/index.d.ts', readFile, cache) },
  ];
  const semanticCss = readFileSync(resolve(dist, 'tokens', 'semantic.css'), 'utf8');
  const themeFiles = readdirSync(resolve(dist, 'tokens', 'themes')).filter((f) => f.endsWith('.css'));
  const themes = [...new Set([...semanticCss.matchAll(/\[data-theme='([\w-]+)'\]/g)].map((m) => m[1]).concat(themeFiles.map((f) => f.replace(/\.css$/, ''))))];
  const css = { layers: layerNames(readFileSync(resolve(dist, 'tokens', 'index.css'), 'utf8')), themes, semantic: customProperties(semanticCss) };
  const report = renderReport({ packageName: pkg.name, entries, subpaths: Object.keys(pkg.exports), css });

  const out = resolve(root, 'docs', 'api-surface.md');
  if (process.argv.includes('--check')) {
    const committed = existsSync(out) ? readFileSync(out, 'utf8').replace(/\r\n/g, '\n') : '';
    if (committed !== report) {
      const diff = lineDiff(committed, report);
      console.error(`docs/api-surface.md is out of date with the build (${diff.length} line(s) differ):`);
      console.error(diff.slice(0, 40).map((l) => `  ${l}`).join('\n') + (diff.length > 40 ? `\n  ... and ${diff.length - 40} more` : ''));
      console.error('\nThe public API changed. Run npm run build:lib && npm run api:report, review the diff with docs/versioning.md in mind, and commit docs/api-surface.md.');
      process.exit(1);
    }
    console.log(`API report OK: docs/api-surface.md matches the build (core ${entries[0].exports.size}, commerce ${entries[1].exports.size} exports).`);
  } else {
    writeFileSync(out, report);
    console.log(`Wrote docs/api-surface.md (core ${entries[0].exports.size}, commerce ${entries[1].exports.size} exports; ${css.semantic.length} semantic properties; themes ${themes.join(', ')}).`);
  }
}
