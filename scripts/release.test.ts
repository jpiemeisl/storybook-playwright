import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bumpVersion, changelogSection, ciStatusVerdict, hasNotes, parseChangelog, parseRepo, releaseChangelog, today } from './release.mjs';

const repo = 'https://github.com/o/r';
const changelog = `# Changelog

Intro.

## [Unreleased]

### Fixed

- Dialogs no longer close when reopened quickly.

## [0.1.0] - 2026-11-22

### Added

- Everything.

[Unreleased]: ${repo}/compare/v0.1.0...HEAD
[0.1.0]: ${repo}/releases/tag/v0.1.0
`;

describe('release', () => {
  it('bumps plain semver versions', () => {
    expect(bumpVersion('0.1.0', 'patch')).toBe('0.1.1');
    expect(bumpVersion('0.1.9', 'minor')).toBe('0.2.0');
    expect(bumpVersion('0.9.3', 'major')).toBe('1.0.0');
    expect(() => bumpVersion('1.0.0-beta.1', 'patch')).toThrow(/plain x.y.z/);
    expect(() => bumpVersion('1.0.0', 'huge')).toThrow(/Unknown bump/);
  });

  it('reads the GitHub repository from package.json', () => {
    expect(parseRepo({ url: 'git+https://github.com/jpiemeisl/storybook-playwright.git' })).toEqual({ owner: 'jpiemeisl', repo: 'storybook-playwright', url: 'https://github.com/jpiemeisl/storybook-playwright' });
    expect(parseRepo('https://github.com/o/r')).toMatchObject({ owner: 'o', repo: 'r' });
    expect(() => parseRepo('https://gitlab.com/o/r')).toThrow(/not a GitHub repository/);
  });

  it('parses CHANGELOG sections and links', () => {
    const log = parseChangelog(changelog);
    expect(log.preamble).toBe('# Changelog\n\nIntro.');
    expect(log.sections.map((s) => [s.name, s.date])).toEqual([['Unreleased', null], ['0.1.0', '2026-11-22']]);
    expect(log.links).toHaveLength(2);
    expect(changelogSection(changelog, '0.1.0')).toBe('### Added\n\n- Everything.');
    expect(changelogSection(changelog, '0.2.0')).toBeNull();
    expect(hasNotes('### Added')).toBe(false);
    expect(hasNotes('### Added\n\n- A thing.')).toBe(true);
  });

  it('moves the Unreleased notes under the new version and updates the links', () => {
    const next = releaseChangelog(changelog, '0.1.1', '2026-12-01', repo);
    const log = parseChangelog(next);
    expect(log.sections.map((s) => [s.name, s.date])).toEqual([['Unreleased', null], ['0.1.1', '2026-12-01'], ['0.1.0', '2026-11-22']]);
    expect(log.sections[0]!.body).toBe('');
    expect(changelogSection(next, '0.1.1')).toBe('### Fixed\n\n- Dialogs no longer close when reopened quickly.');
    expect(log.links).toEqual([`[Unreleased]: ${repo}/compare/v0.1.1...HEAD`, `[0.1.1]: ${repo}/compare/v0.1.0...v0.1.1`, `[0.1.0]: ${repo}/releases/tag/v0.1.0`]);
    expect(next).toContain('## [Unreleased]\n\n## [0.1.1] - 2026-12-01\n\n### Fixed');
  });

  it('refuses a release without notes or with an existing section', () => {
    const empty = releaseChangelog(changelog, '0.1.1', '2026-12-01', repo);
    expect(() => releaseChangelog(empty, '0.1.2', '2026-12-02', repo)).toThrow(/has no notes/);
    expect(() => releaseChangelog(changelog, '0.1.0', '2026-12-01', repo)).toThrow(/already has a section/);
    expect(() => releaseChangelog('# Changelog\n', '0.1.0', '2026-12-01', repo)).toThrow(/no "## \[Unreleased\]"/);
  });

  it('the committed CHANGELOG has notes for the version in package.json', () => {
    const root = resolve(import.meta.dirname, '..');
    const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
    expect(changelogSection(readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8'), version)).toBeTruthy();
  });

  it('formats today as YYYY-MM-DD', () => {
    expect(today(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('judges the latest ci-status check run', () => {
    const run = (over: object) => ({ id: 1, name: 'ci-status', status: 'completed', conclusion: 'success', started_at: '2026-11-22T10:00:00Z', ...over });
    expect(ciStatusVerdict({ check_runs: [run({})] }).ok).toBe(true);
    expect(ciStatusVerdict({ check_runs: [] }).message).toMatch(/No ci-status check run/);
    expect(ciStatusVerdict({ check_runs: [run({ status: 'in_progress', conclusion: null })] }).message).toMatch(/not finished/);
    expect(ciStatusVerdict({ check_runs: [run({ conclusion: 'failure' })] }).message).toMatch(/concluded "failure"/);
    // A re-run that passed after a failure counts, and the reverse.
    const failed = run({ id: 1, conclusion: 'failure', started_at: '2026-11-22T10:00:00Z' });
    const passed = run({ id: 2, conclusion: 'success', started_at: '2026-11-22T11:00:00Z' });
    expect(ciStatusVerdict({ check_runs: [failed, passed] }).ok).toBe(true);
    expect(ciStatusVerdict({ check_runs: [{ ...passed, started_at: '2026-11-22T09:00:00Z' }, failed] }).ok).toBe(false);
    expect(ciStatusVerdict({ check_runs: [run({ name: 'checks' })] }).ok).toBe(false);
  });
});
