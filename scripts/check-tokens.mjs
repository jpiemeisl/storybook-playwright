#!/usr/bin/env node
/*
 * Token check (plain Node, no dependencies). Components may only use semantic tokens, so a theme can
 * restyle them by overriding the semantic tier. Scans every .css file outside src/tokens/ (src/,
 * demo/, .storybook/) and fails on:
 *   - primitive color, radius, shadow and font-family tokens (read from src/tokens/primitives.css)
 *   - raw colors: #hex, rgb(), rgba(), hsl(), hsla(), and named colors
 * Allowed: transparent, currentColor, inherit, initial, unset, and forced-colors system colors
 * (Canvas, CanvasText, Highlight, ...). Exceptions live in scripts/check-tokens.allow.json, each with a
 * written reason. Usage: node scripts/check-tokens.mjs   (exit code 1 on violations)
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCAN = ['src', 'demo', '.storybook'];
const SKIP_DIRS = new Set(['node_modules', 'tokens']);

/** CSS named colors (CSS Color 4), lower case. */
const NAMED = new Set(
  'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'.split(' '),
);

/** Primitive token names that components must not use: colors, radii, shadows and font families. */
export function forbiddenPrimitives(primitivesCss) {
  const names = [...primitivesCss.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]);
  return new Set(names.filter((n) => /^--(neutral|teal|red|green|amber|black-alpha|white-alpha)-|^--radius-|^--shadow-|^--font-(sans|serif|mono)$/.test(n)));
}

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));

/**
 * Violations in one CSS source. Pure. Only declaration values are checked (selectors such as
 * `.red` or `[data-tone='green']` are fine), so a named color must appear after a colon.
 */
export function checkCss(css, primitives) {
  const found = [];
  const lines = stripComments(css).split(/\r?\n/);
  lines.forEach((line, i) => {
    const colon = line.indexOf(':');
    // Declarations only: "prop: value". Skip selectors with pseudo-classes by requiring a value end (; or }) or a property-ish start.
    const decl = /^\s*(--[\w-]+|[a-z-]+)\s*:(.*)$/.exec(line);
    if (!decl || colon < 0) return;
    const value = decl[2];
    const at = (message) => found.push({ line: i + 1, message, text: line.trim() });
    for (const m of value.matchAll(/var\(\s*(--[\w-]+)/g)) if (primitives.has(m[1])) at(`primitive token ${m[1]}`);
    for (const m of value.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) at(`raw color ${m[0]}`);
    for (const m of value.matchAll(/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/g)) at(`raw color ${m[1]}()`);
    for (const m of value.replace(/var\([^)]*\)|url\([^)]*\)|'[^']*'|"[^"]*"/g, '').matchAll(/\b([a-zA-Z]+)\b/g)) {
      if (NAMED.has(m[1].toLowerCase())) at(`named color ${m[1]}`);
    }
  });
  return found;
}

function listCss(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) && relative(ROOT, path).split(sep).join('/') === 'src/tokens' ? [] : e.name === 'node_modules' ? [] : listCss(path);
    return e.name.endsWith('.css') ? [path] : [];
  });
}

/** Allowlist: [{ file, match, reason }]. An entry silences violations in `file` whose line contains `match`. */
export function applyAllowlist(file, violations, allow) {
  return violations.filter((v) => !allow.some((a) => a.file === file && v.text.includes(a.match)));
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const primitives = forbiddenPrimitives(readFileSync(join(ROOT, 'src/tokens/primitives.css'), 'utf8'));
  const allow = JSON.parse(readFileSync(join(ROOT, 'scripts/check-tokens.allow.json'), 'utf8')).entries;
  const missingReasons = allow.filter((a) => !a.reason || a.reason.trim().length < 10);
  if (missingReasons.length) {
    console.error(`Allowlist entries need a written reason: ${missingReasons.map((a) => a.file).join(', ')}`);
    process.exit(1);
  }
  const files = SCAN.flatMap((d) => listCss(join(ROOT, d)));
  let total = 0;
  for (const path of files) {
    const file = relative(ROOT, path).split(sep).join('/');
    const violations = applyAllowlist(file, checkCss(readFileSync(path, 'utf8'), primitives), allow);
    for (const v of violations) console.error(`${file}:${v.line}  ${v.message}\n    ${v.text}`);
    total += violations.length;
  }
  if (total) {
    console.error(`\n${total} token violation(s). Use semantic tokens (src/tokens/semantic.css) or add a reasoned entry to scripts/check-tokens.allow.json.`);
    process.exit(1);
  }
  console.log(`Tokens OK (${files.length} CSS files checked, ${allow.length} allowlisted exceptions).`);
}
