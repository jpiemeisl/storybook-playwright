#!/usr/bin/env node
/*
 * Shared release logic for npm run release:prepare, npm run release:tag and .github/workflows/release.yml.
 * The functions are pure (unit-tested in release.test.ts). The CLI:
 *   node scripts/release.mjs notes <version>       prints that version's CHANGELOG section (release notes)
 *   node scripts/release.mjs ci-status <file.json> exits 0 only when the check-runs JSON (GitHub API,
 *                                                  commits/{sha}/check-runs?check_name=ci-status) shows
 *                                                  the latest ci-status run concluded success
 * See docs/publishing.md.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
export const BUMPS = ['patch', 'minor', 'major'];

/** The next version. Plain x.y.z only: this library does not publish pre-releases. */
export function bumpVersion(version, kind) {
  const m = SEMVER.exec(version);
  if (!m) throw new Error(`"${version}" is not a plain x.y.z version`);
  if (!BUMPS.includes(kind)) throw new Error(`Unknown bump "${kind}": use patch, minor or major`);
  const [major, minor, patch] = m.slice(1).map(Number);
  if (kind === 'major') return `${major + 1}.0.0`;
  if (kind === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** The release tag for a version. */
export const tagFor = (version) => `v${version}`;

/** Owner and repository name from package.json's repository field. */
export function parseRepo(repository) {
  const url = typeof repository === 'string' ? repository : repository?.url;
  const m = /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(url ?? '');
  if (!m) throw new Error(`package.json repository "${url}" is not a GitHub repository URL`);
  return { owner: m[1], repo: m[2], url: `https://github.com/${m[1]}/${m[2]}` };
}

const HEADING = /^## \[([^\]]+)\](?:\s+-\s+(\d{4}-\d{2}-\d{2}))?\s*$/;

/**
 * The CHANGELOG ("Keep a Changelog" layout) as { preamble, sections, links }: sections are the "## [...]"
 * blocks in order ({ name, date, body }); links are the "[name]: url" reference lines at the end.
 */
export function parseChangelog(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const preamble = [];
  const sections = [];
  const links = [];
  for (const line of lines) {
    const heading = HEADING.exec(line);
    if (heading) sections.push({ name: heading[1], date: heading[2] ?? null, lines: [] });
    else if (/^\[[^\]]+\]:\s+\S+/.test(line)) links.push(line);
    else if (sections.length) sections.at(-1).lines.push(line);
    else preamble.push(line);
  }
  return {
    preamble: preamble.join('\n').trimEnd(),
    sections: sections.map(({ name, date, lines: body }) => ({ name, date, body: body.join('\n').trim() })),
    links,
  };
}

/** The notes for one version, or null when the CHANGELOG has no section (or an empty one) for it. */
export function changelogSection(text, version) {
  const section = parseChangelog(text).sections.find((s) => s.name === version);
  return section && section.body ? section.body : null;
}

/** True when a section body has at least one list item (a "### Added" heading alone is not a note). */
export const hasNotes = (body) => /^\s*[-*] \S/m.test(body ?? '');

/**
 * The CHANGELOG after releasing `version` on `date`: the Unreleased notes move under "## [version] - date",
 * Unreleased is left empty, and the comparison links at the end are updated.
 */
export function releaseChangelog(text, version, date, repoUrl) {
  const log = parseChangelog(text);
  const unreleased = log.sections.find((s) => s.name === 'Unreleased');
  if (!unreleased) throw new Error('CHANGELOG.md has no "## [Unreleased]" section');
  if (!hasNotes(unreleased.body)) throw new Error('The "Unreleased" section of CHANGELOG.md has no notes. Add them before preparing a release.');
  if (log.sections.some((s) => s.name === version)) throw new Error(`CHANGELOG.md already has a section for ${version}`);
  const previous = log.sections.find((s) => SEMVER.test(s.name));

  const sections = [{ name: 'Unreleased', date: null, body: '' },{ name: version, date, body: unreleased.body }, ...log.sections.filter((s) => s.name !== 'Unreleased')];
  const otherLinks = log.links.filter((l) => !l.startsWith('[Unreleased]:') && !l.startsWith(`[${version}]:`));
  const links = [
    `[Unreleased]: ${repoUrl}/compare/${tagFor(version)}...HEAD`,
    previous ? `[${version}]: ${repoUrl}/compare/${tagFor(previous.name)}...${tagFor(version)}` : `[${version}]: ${repoUrl}/releases/tag/${tagFor(version)}`,
    ...otherLinks,
  ];
  return renderChangelog({ preamble: log.preamble, sections, links });
}

/** Writes a parsed CHANGELOG back out. */
export function renderChangelog({ preamble, sections, links }) {
  const parts = [preamble, ''];
  for (const s of sections) {
    parts.push(`## [${s.name}]${s.date ? ` - ${s.date}` : ''}`, '');
    if (s.body) parts.push(s.body, '');
  }
  if (links.length) parts.push(...links, '');
  return parts.join('\n');
}

/** Today's date as YYYY-MM-DD in local time. */
export const today = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

/**
 * The verdict on a check-runs API response for check_name=ci-status: { ok, message }. The newest run counts
 * (re-runs create new check runs for the same commit).
 */
export function ciStatusVerdict(response, sha = 'the commit') {
  const runs = [...(response?.check_runs ?? [])].filter((run) => run.name === 'ci-status');
  if (!runs.length) return { ok: false, message: `No ci-status check run was found for ${sha}. CI runs on every push to main; wait for it, or check that the commit was pushed.` };
  runs.sort((a, b) => String(b.started_at ?? '').localeCompare(String(a.started_at ?? '')) || (b.id ?? 0) - (a.id ?? 0));
  const [latest] = runs;
  if (latest.status !== 'completed') return { ok: false, message: `ci-status for ${sha} has not finished yet (${latest.status}). Wait for it and try again.` };
  if (latest.conclusion !== 'success') return { ok: false, message: `ci-status for ${sha} concluded "${latest.conclusion}". Only commits that passed CI can be released.` };
  return { ok: true, message: `ci-status for ${sha} passed (${latest.html_url ?? 'check run'}).` };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [command, arg] = process.argv.slice(2);
  if (command === 'notes' && arg) {
    const notes = changelogSection(readFileSync('CHANGELOG.md', 'utf8'), arg);
    if (!notes) {
      console.error(`CHANGELOG.md has no notes for ${arg}.`);
      process.exit(1);
    }
    console.log(notes);
  } else if (command === 'ci-status' && arg) {
    const verdict = ciStatusVerdict(JSON.parse(readFileSync(arg, 'utf8')), process.env.SHA);
    (verdict.ok ? console.log : console.error)(verdict.message);
    process.exit(verdict.ok ? 0 : 1);
  } else {
    console.error('Usage: node scripts/release.mjs notes <version> | ci-status <check-runs.json>');
    process.exit(1);
  }
}
