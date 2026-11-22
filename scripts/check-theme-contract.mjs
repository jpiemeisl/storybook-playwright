#!/usr/bin/env node
/*
 * Theme contract check (plain Node, no dependencies). Every theme in src/tokens/themes/ must:
 *   - scope itself to [data-theme='<file name>']
 *   - define EVERY semantic colour token (--color-*) of the default palette, so it can never inherit a
 *     light-on-light or dark-on-dark value; shape, depth and type tokens may inherit
 *   - define every token the default inverse surface remaps, in its own [data-surface='inverse'] rule
 *   - define no token the default theme does not have
 *   - reference only primitives or semantic tokens that exist
 * Usage: node scripts/check-theme-contract.mjs   (exit code 1 on problems)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Innermost rules of a stylesheet as { selector, decls: Map(name -> value) }. Handles nested at-rules. */
export function parseRules(css) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  const stack = [];
  let start = 0;
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '{') {
      stack.push({ prelude: src.slice(start, i).trim(), open: i + 1, nested: false });
      if (stack.length > 1) stack[stack.length - 2].nested = true;
      start = i + 1;
    } else if (src[i] === '}') {
      const block = stack.pop();
      if (block && !block.nested && !block.prelude.startsWith('@')) {
        const decls = new Map();
        for (const part of src.slice(block.open, i).split(';')) {
          const m = /^\s*([\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(part);
          if (m) decls.set(m[1], m[2]);
        }
        rules.push({ selector: block.prelude.replace(/\s+/g, ' '), decls });
      }
      start = i + 1;
    } else if (src[i] === ';' && stack.length === 0) {
      start = i + 1;
    }
  }
  return rules;
}

const names = (decls) => [...decls.keys()].filter((k) => k.startsWith('--'));

/** Problems for one theme. Pure, for unit tests. */
export function checkTheme(name, themeCss, semanticCss, primitivesCss) {
  const problems = [];
  const semantic = parseRules(semanticCss);
  const defaultPalette = semantic.find((r) => r.selector.includes(":root"));
  const defaultInverse = semantic.find((r) => r.selector === "[data-surface='inverse']");
  if (!defaultPalette || !defaultInverse) return ['semantic.css: default palette or inverse rule not found'];
  const known = new Set([...names(defaultPalette.decls), ...names(defaultInverse.decls)]);
  const primitives = new Set(names(parseRules(primitivesCss).flatMap((r) => [...r.decls]).reduce((m, [k, v]) => m.set(k, v), new Map())));

  if (!themeCss.includes(`[data-theme='${name}']`)) problems.push(`${name}: must be scoped to [data-theme='${name}']`);
  const rules = parseRules(themeCss);
  const palette = rules.find((r) => r.selector.includes(':scope'));
  const inverse = rules.find((r) => r.selector === "[data-surface='inverse']");
  if (!palette) return [...problems, `${name}: no palette rule (:scope, [data-surface='default'])`];
  if (!inverse) problems.push(`${name}: no [data-surface='inverse'] rule`);
  if (!palette.decls.has('color-scheme')) problems.push(`${name}: palette must set color-scheme`);

  for (const token of names(defaultPalette.decls).filter((t) => t.startsWith('--color-'))) {
    if (!palette.decls.has(token)) problems.push(`${name}: palette is missing ${token}`);
  }
  if (inverse) for (const token of names(defaultInverse.decls)) if (!inverse.decls.has(token)) problems.push(`${name}: inverse surface is missing ${token}`);
  for (const rule of [palette, inverse].filter(Boolean)) {
    for (const [token, value] of rule.decls) {
      if (token.startsWith('--') && !known.has(token)) problems.push(`${name}: ${token} is not a semantic token of the default theme`);
      for (const m of value.matchAll(/var\(\s*(--[\w-]+)/g)) if (!primitives.has(m[1]) && !known.has(m[1])) problems.push(`${name}: ${token} references unknown ${m[1]}`);
    }
  }
  return problems;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const read = (p) => readFileSync(join(ROOT, p), 'utf8');
  const semantic = read('src/tokens/semantic.css');
  const primitives = read('src/tokens/primitives.css');
  const dir = join(ROOT, 'src/tokens/themes');
  const files = readdirSync(dir).filter((f) => f.endsWith('.css'));
  const problems = files.flatMap((f) => checkTheme(basename(f, '.css'), readFileSync(join(dir, f), 'utf8'), semantic, primitives));
  if (problems.length) {
    console.error(`Theme contract problems (${problems.length}):\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`Themes OK (${files.length} themes: ${files.map((f) => basename(f, '.css')).join(', ')}).`);
}
