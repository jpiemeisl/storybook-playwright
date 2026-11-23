#!/usr/bin/env node
/*
 * npm run check:docs: keeps the Markdown documentation true to the repository. Scans every .md file
 * (except dependencies and build or test output) and fails on:
 *   links       relative links to missing files, and #anchors that match no heading (GitHub slug rules)
 *   scripts     `npm run <name>` where package.json has no such script
 *   paths       repository paths (src/, docs/, scripts/, tests/, .github/, docker/, demo/) in inline code
 *               that don't exist; scripts/check-docs.allow.json lists intentional exceptions with a reason
 *   examples    ```ts check and ```tsx check code blocks that don't typecheck against the library source
 *   stale       phrases from scripts/check-docs.stale.json (things that are no longer true, house style)
 *   orphans     files in docs/ that docs/README.md (the index) doesn't link to
 *   versions    hard-coded Node, Playwright, Storybook or package versions in prose; mark a deliberate one
 *               with <!-- check-docs: version-ok --> on the same line
 * npm run check:docs:external (not part of check:all) checks external links with HEAD requests and only
 * reports. docs/maintaining-docs.md documents the rules. No dependencies.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const EXCLUDED_DIRS = new Set(['node_modules', 'dist', 'storybook-static', 'playwright-report', 'test-results', 'blob-report', 'all-blob-reports', '.git', '.claude', '.playwright-mcp', 'coverage']);
/** History files: phrases and versions in them describe the past on purpose. */
export const HISTORY_FILES = new Set(['CHANGELOG.md', 'docs/GAPS.md']);
/** Generated files: fixed at their source (JSDoc, story titles, the build), never by hand. */
export const GENERATED_FILES = new Set(['docs/COMPONENTS.md', 'docs/content-model.md', 'docs/api-surface.md']);
export const REPO_PATH = /^(?:\.\/)?(?:src|docs|scripts|tests|\.github|docker|demo)\/[^\s]*$/;

// ---------------------------------------------------------------------------------------------------
// Markdown structure

/**
 * Splits Markdown into lines with their kind, so rules can skip fenced code. Returns
 * [{ line (1-based), text, inFence, fence? }] where fence lines carry { info } for an opening fence.
 */
export function scanLines(markdown) {
  const out = [];
  let fence = null;
  markdown.replace(/\r\n/g, '\n').split('\n').forEach((text, i) => {
    const m = /^\s*(`{3,}|~{3,})(.*)$/.exec(text);
    if (fence) {
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length && !m[2].trim()) {
        out.push({ line: i + 1, text, inFence: true, fenceEnd: true });
        fence = null;
      } else out.push({ line: i + 1, text, inFence: true });
    } else if (m) {
      fence = m[1];
      out.push({ line: i + 1, text, inFence: true, fenceStart: true, info: m[2].trim() });
    } else out.push({ line: i + 1, text, inFence: false });
  });
  return out;
}

/** The text of a line with inline code spans replaced by spaces (for rules about prose and links). */
export const withoutInlineCode = (text) => text.replace(/(`+)([\s\S]*?)\1/g, (s) => ' '.repeat(s.length));
/** Inline code spans on a line. */
export const inlineCode = (text) => [...text.matchAll(/(`+)([\s\S]*?)\1/g)].map((m) => m[2].trim());

/** GitHub's heading anchor for one heading's text (before de-duplication). */
export function slug(heading) {
  return heading
    .replace(/<[^>]+>/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*+/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

/** Every anchor a Markdown file defines: heading slugs with GitHub's -1, -2 suffixes, and explicit ids. */
export function anchors(markdown) {
  const seen = new Map();
  const result = new Set();
  for (const { text, inFence } of scanLines(markdown)) {
    if (inFence) continue;
    const h = /^ {0,3}#{1,6}\s+(.*?)\s*#*\s*$/.exec(text);
    if (h) {
      const base = slug(h[1]);
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      result.add(n ? `${base}-${n}` : base);
    }
    for (const m of text.matchAll(/<a\s+(?:name|id)="([^"]+)"/g)) result.add(m[1]);
  }
  return result;
}

/** Links on a line outside inline code: [{ target, image }], including reference definitions. */
export function links(text) {
  const prose = withoutInlineCode(text);
  const out = [];
  for (const m of prose.matchAll(/(!?)\[(?:[^\]\\]|\\.)*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) out.push({ target: m[2], image: !!m[1] });
  const ref = /^\s{0,3}\[[^\]]+\]:\s+<?(\S+?)>?(?:\s+"[^"]*")?\s*$/.exec(prose);
  if (ref) out.push({ target: ref[1], image: false });
  for (const m of prose.matchAll(/<(?:a|img)\s[^>]*(?:href|src)="([^"]+)"/g)) out.push({ target: m[1], image: false });
  return out;
}

export const isExternal = (target) => /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//');

// ---------------------------------------------------------------------------------------------------
// Rules. Each takes { file (repo-relative, POSIX), text } plus what it needs and returns problems
// [{ file, line, rule, message }].

const problem = (file, line, rule, message) => ({ file, line, rule, message });

/** Broken relative links and anchors. `exists(path)` and `read(path)` work on repo-relative POSIX paths. */
export function checkLinks({ file, text }, { exists, read }) {
  const problems = [];
  for (const { line, text: lineText, inFence } of scanLines(text)) {
    if (inFence) continue;
    for (const { target } of links(lineText)) {
      if (isExternal(target)) continue;
      const [pathPart, anchor] = target.split('#');
      const path = decodeURIComponent(pathPart.split('?')[0]);
      const resolved = path ? posix.normalize(posix.join(posix.dirname(file), path)).replace(/\/$/, '') : file;
      if (resolved.startsWith('..')) {
        problems.push(problem(file, line, 'links', `${target} points outside the repository; use an absolute URL`));
        continue;
      }
      if (path && !exists(resolved)) {
        problems.push(problem(file, line, 'links', `${target}: ${resolved} does not exist`));
        continue;
      }
      if (anchor && resolved.endsWith('.md')) {
        const content = read(resolved);
        if (content != null && !anchors(content).has(anchor)) problems.push(problem(file, line, 'links', `${target}: no heading with the anchor #${anchor} in ${resolved}`));
      }
    }
  }
  return problems;
}

/** `npm run <script>` mentions of scripts that don't exist. */
export function checkScripts({ file, text }, { scripts, allowed = new Set() }) {
  const problems = [];
  for (const { line, text: lineText } of scanLines(text)) {
    for (const m of lineText.matchAll(/\bnpm run ([\w:.-]+)/g)) {
      const name = m[1].replace(/[.:]+$/, '');
      if (!scripts.has(name) && !allowed.has(name)) problems.push(problem(file, line, 'scripts', `npm run ${name}: package.json has no "${name}" script`));
    }
  }
  return problems;
}

/** Normalizes a code span to a checkable repo path, or null when it isn't one (placeholders, globs, URLs). */
export function repoPath(span) {
  if (/[*<>{}\[\]$…]|\.\.\./.test(span) || span.trim().includes(' ')) return null;
  const candidate = span.trim().replace(/[),.;:]+$/, '').replace(/:\d+(?::\d+)?$/, '').replace(/^\.\//, '');
  if (!REPO_PATH.test(candidate)) return null;
  return candidate.replace(/\/$/, '');
}

/** Repository paths in inline code that don't exist. `allowed` is a Set of paths. */
export function checkPaths({ file, text }, { exists, allowed = new Set() }) {
  const problems = [];
  for (const { line, text: lineText, inFence } of scanLines(text)) {
    if (inFence) continue;
    for (const span of inlineCode(lineText)) {
      const path = repoPath(span);
      if (path && !exists(path) && !allowed.has(path)) problems.push(problem(file, line, 'paths', `\`${span}\`: ${path} does not exist (or add it to scripts/check-docs.allow.json with a reason)`));
    }
  }
  return problems;
}

/** Fenced blocks tagged ```ts check or ```tsx check: [{ line, lang, code }] (line = first code line). */
export function checkedBlocks(markdown) {
  const blocks = [];
  let current = null;
  for (const entry of scanLines(markdown)) {
    if (entry.fenceStart) {
      const m = /^(tsx?)\s+check\b/.exec(entry.info);
      current = m ? { line: entry.line + 1, lang: m[1], lines: [] } : null;
    } else if (entry.fenceEnd) {
      if (current) blocks.push({ line: current.line, lang: current.lang, code: current.lines.join('\n') });
      current = null;
    } else if (current) current.lines.push(entry.text);
  }
  return blocks;
}

/**
 * Stale phrases. `entries` is [{ pattern, reason, files? (only these), ignore? (not these), scope? }];
 * patterns are case-insensitive regular expressions matched against prose and inline code (not fenced
 * code). With scope "prose" inline code is skipped too, so code identifiers (normalisePath) don't match
 * a spelling rule.
 */
export function checkStale({ file, text }, entries) {
  if (HISTORY_FILES.has(file)) return [];
  const problems = [];
  const compiled = entries
    .filter((e) => (!e.files || e.files.includes(file)) && !(e.ignore ?? []).includes(file))
    .map((e) => ({ ...e, regex: new RegExp(e.pattern, 'giu') }));
  for (const { line, text: lineText, inFence } of scanLines(text)) {
    if (inFence) continue;
    for (const entry of compiled) {
      entry.regex.lastIndex = 0;
      const m = entry.regex.exec(entry.scope === 'prose' ? withoutInlineCode(lineText) : lineText);
      if (m) problems.push(problem(file, line, 'stale', `"${m[0]}": ${entry.reason}`));
    }
  }
  return problems;
}

/** Files under docs/ that the index (docs/README.md) doesn't link to. */
export function checkOrphans(docFiles, indexText) {
  const linked = new Set();
  for (const { text, inFence } of scanLines(indexText)) {
    if (inFence) continue;
    for (const { target } of links(text)) if (!isExternal(target)) linked.add(posix.normalize(posix.join('docs', target.split('#')[0])));
  }
  return docFiles.filter((f) => f.startsWith('docs/') && f !== 'docs/README.md' && !linked.has(f)).map((f) => problem(f, 1, 'orphans', `${f} is not linked from docs/README.md (the docs index)`));
}

export const VERSION_PATTERNS = [
  [/\bNode(?:\.js)?\s+v?\d{2}\b/i, 'a Node version (point at .nvmrc)'],
  [/\bPlaywright\s+v?\d+\.\d+/i, 'a Playwright version (point at docker/image.json or package.json)'],
  [/\bStorybook\s+v?\d+\b/i, 'a Storybook version (point at package.json)'],
  [/@jpiemeisl\/pattern-library@[~^]?\d/, 'a package version (point at package.json or the CHANGELOG)'],
];
const VERSION_OK = /<!--\s*check-docs:\s*version-ok\s*-->/;
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Patterns for the versions in use today, which go stale on the next bump: `current` is
 * [[version, what]], for example [['0.1.0', 'the package version (package.json)']]. Example versions in
 * explanations (0.2.0, 1.0.0) are not flagged.
 */
export const currentVersionPatterns = (current) => current.map(([version, what]) => [new RegExp(`(?<![\\w.-])v?${escape(version)}(?![\\w.-])`), what]);

/** Hard-coded versions in prose (fenced code is exempt). Lines marked version-ok are exempt. */
export function checkVersions({ file, text }, current = []) {
  if (HISTORY_FILES.has(file) || GENERATED_FILES.has(file)) return [];
  const patterns = [...VERSION_PATTERNS, ...currentVersionPatterns(current)];
  const problems = [];
  for (const { line, text: lineText, inFence } of scanLines(text)) {
    if (inFence || VERSION_OK.test(lineText)) continue;
    const prose = lineText.replace(/\]\([^)]*\)/g, ']()').replace(/<!--[\s\S]*?-->/g, '');
    for (const [pattern, what] of patterns) {
      const m = pattern.exec(prose);
      if (m) {
        problems.push(problem(file, line, 'versions', `"${m[0]}" hard-codes ${what}. Point at the source of truth, or mark the line with <!-- check-docs: version-ok -->`));
        break;
      }
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------------------------------
// Checked examples: typechecked against the library source (src/index.ts, src/commerce/index.ts) through
// tsconfig paths, so they need no build and see exactly the types the package publishes.

const STUBS = `// Minimal stand-ins for router modules used in documented examples (not installed in this repo).
declare module 'next/link' {
  import type { AnchorHTMLAttributes, ComponentType } from 'react';
  const Link: ComponentType<AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>;
  export default Link;
}
declare module 'react-router' {
  import type { AnchorHTMLAttributes, ComponentType, ReactNode } from 'react';
  export const Link: ComponentType<AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }>;
  export function Routes(props: { children?: ReactNode }): ReactNode;
}
`;

/** Typechecks the checked blocks; returns problems mapped back to Markdown lines. */
export function typecheckExamples(blocks, root) {
  if (!blocks.length) return [];
  const rel = `node_modules/.cache/check-docs-${process.pid}`;
  const dir = join(root, rel);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'tsconfig.json'),
    JSON.stringify({
      extends: '../../../tsconfig.json',
      compilerOptions: {
        noUnusedLocals: false,
        noUnusedParameters: false,
        paths: { '@jpiemeisl/pattern-library': ['../../../src/index.ts'], '@jpiemeisl/pattern-library/commerce': ['../../../src/commerce/index.ts'] },
      },
      include: ['*.ts', '*.tsx'],
    }),
  );
  writeFileSync(join(dir, 'stubs.d.ts'), STUBS);
  const map = new Map();
  blocks.forEach((block, i) => {
    const name = `example-${String(i).padStart(3, '0')}.${block.lang}`;
    map.set(name, block);
    writeFileSync(join(dir, name), `${block.code}\nexport {};\n`);
  });
  let output = '';
  try {
    execSync(`npx tsc -p ${rel}/tsconfig.json --pretty false`, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  const problems = [];
  for (const raw of output.split('\n')) {
    const m = /([^\s\\/]+\.tsx?)\((\d+),(\d+)\): error (TS\d+: .*)$/.exec(raw.trim());
    if (m && map.has(m[1])) {
      const block = map.get(m[1]);
      problems.push(problem(block.file, block.line + Number(m[2]) - 1, 'examples', m[4]));
    } else if (/error TS/.test(raw)) problems.push(problem('(examples)', 0, 'examples', raw.trim()));
  }
  return problems;
}

// ---------------------------------------------------------------------------------------------------
// Files and external links

/** Every Markdown file under `root`, as repo-relative POSIX paths, skipping dependencies and output. */
export function markdownFiles(root, dir = root) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) out.push(...markdownFiles(root, join(dir, entry.name)));
    } else if (entry.name.endsWith('.md')) out.push(relative(root, join(dir, entry.name)).split(sep).join('/'));
  }
  return out.sort();
}

/** External http(s) links in Markdown, with where they appear. */
export function externalLinks(file, text) {
  const out = [];
  for (const { line, text: lineText, inFence } of scanLines(text)) {
    if (inFence) continue;
    for (const { target } of links(lineText)) if (/^https?:\/\//.test(target)) out.push({ file, line, url: target });
  }
  return out;
}

/** Hosts that are examples or placeholders, never fetched. */
export const SKIP_HOSTS = /^(localhost|127\.0\.0\.1|example\.(com|org|net)|[\w-]+\.example)$/;

async function checkExternal(root) {
  const all = markdownFiles(root).flatMap((file) => externalLinks(file, readFileSync(join(root, file), 'utf8')));
  const urls = [...new Set(all.map((l) => l.url.split('#')[0]))].filter((u) => !SKIP_HOSTS.test(new URL(u).hostname));
  console.log(`Checking ${urls.length} external URLs (HEAD, falling back to GET)...`);
  const results = new Map();
  const queue = [...urls];
  const worker = async () => {
    while (queue.length) {
      const url = queue.shift();
      let status;
      for (const method of ['HEAD', 'GET']) {
        try {
          const response = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'check-docs-external' } });
          status = response.status;
          if (status < 400 || ![403, 405, 404, 429].includes(status)) break;
        } catch (error) {
          status = error.name === 'TimeoutError' ? 'timeout' : error.cause?.code ?? error.message;
        }
      }
      results.set(url, status);
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  const bad = [...results].filter(([, s]) => typeof s !== 'number' || s >= 400);
  for (const [url, status] of bad) {
    const where = all.filter((l) => l.url.split('#')[0] === url).map((l) => `${l.file}:${l.line}`).join(', ');
    console.log(`  ${status}  ${url}  (${where})`);
  }
  console.log(`\n${urls.length - bad.length} OK, ${bad.length} to review. (Report only: this never fails. Some sites refuse automated requests; check those by hand.)`);
}

// ---------------------------------------------------------------------------------------------------

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const root = process.cwd();
  if (process.argv.includes('--external')) {
    await checkExternal(root);
    process.exit(0);
  }
  const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
  const allow = readJson('scripts/check-docs.allow.json');
  const stale = readJson('scripts/check-docs.stale.json');
  const pkg = readJson('package.json');
  const scripts = new Set(Object.keys(pkg.scripts));
  const bare = (range) => String(range ?? '').replace(/^[~^>=<\s]+/, '');
  const current = [
    [pkg.version, 'the package version (package.json, CHANGELOG.md)'],
    [bare(pkg.devDependencies['@playwright/test']), 'the Playwright version (docker/image.json, package.json)'],
    [bare(pkg.devDependencies.storybook), 'the Storybook version (package.json)'],
  ].filter(([v]) => v);
  const exists = (path) => existsSync(join(root, path));
  const cache = new Map();
  const read = (path) => {
    if (!cache.has(path)) cache.set(path, existsSync(join(root, path)) && statSync(join(root, path)).isFile() ? readFileSync(join(root, path), 'utf8') : null);
    return cache.get(path);
  };
  const files = markdownFiles(root);
  const problems = [];
  const blocks = [];
  for (const file of files) {
    const doc = { file, text: read(file) };
    problems.push(
      ...checkLinks(doc, { exists, read }),
      ...checkScripts(doc, { scripts, allowed: new Set(allow.scripts.map((s) => s.script)) }),
      ...checkPaths(doc, { exists, allowed: new Set(allow.paths.map((p) => p.path)) }),
      ...checkStale(doc, stale),
      ...checkVersions(doc, current),
    );
    blocks.push(...checkedBlocks(doc.text).map((b) => ({ ...b, file })));
  }
  problems.push(...checkOrphans(files, read('docs/README.md') ?? ''));
  problems.push(...typecheckExamples(blocks, root));

  if (problems.length) {
    const byRule = {};
    for (const p of problems) byRule[p.rule] = (byRule[p.rule] ?? 0) + 1;
    for (const p of problems) console.error(`${p.file}:${p.line}  [${p.rule}] ${p.message}`);
    console.error(`\ncheck:docs found ${problems.length} problem(s): ${Object.entries(byRule).map(([r, n]) => `${r} ${n}`).join(', ')}. See docs/maintaining-docs.md.`);
    process.exit(1);
  }
  console.log(`Docs OK: ${files.length} Markdown files, ${blocks.length} checked examples typecheck, no broken links, scripts, paths, stale phrases, orphans or hard-coded versions.`);
}
