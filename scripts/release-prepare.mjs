#!/usr/bin/env node
/*
 * npm run release:prepare -- <patch|minor|major>
 * On a release branch (never main, which is protected): bumps the version in package.json and
 * package-lock.json without tagging, moves the CHANGELOG "Unreleased" notes under the new version with
 * today's date, rebuilds the library and regenerates docs/api-surface.md, then prints the next steps.
 * It does not commit, push or tag. See docs/publishing.md.
 */
import { execFileSync, execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { BUMPS, bumpVersion, parseRepo, releaseChangelog, tagFor, today } from './release.mjs';

const fail = (message) => {
  console.error(`\nrelease:prepare: ${message}\n`);
  process.exit(1);
};
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
// Fixed command strings only: npm is npm.cmd on Windows, which execSync's shell resolves.
const npm = (command) => execSync(`npm ${command}`, { stdio: 'inherit' });

const kind = process.argv[2];
if (!BUMPS.includes(kind)) fail('Usage: npm run release:prepare -- <patch|minor|major>');

const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
if (branch === 'HEAD') fail('HEAD is detached. Create a release branch first: git switch -c release/<version>');
if (branch === 'main') fail('Run this on a release branch, not main (main is protected). git switch -c release/<version>');
if (git('status', '--porcelain', '--untracked-files=no')) fail('The working tree has uncommitted changes. Commit or stash them first.');

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const next = bumpVersion(pkg.version, kind);
const tag = tagFor(next);
let remoteTag;
try {
  remoteTag = git('ls-remote', '--tags', 'origin', `refs/tags/${tag}`);
} catch {
  fail(`Could not list the tags on origin to check for ${tag}. Check your network and that the origin remote exists, then try again.`);
}
if (git('tag', '--list', tag) || remoteTag) fail(`Tag ${tag} already exists${remoteTag ? ' on origin' : ''}. Version numbers are never reused.`);

// Check the CHANGELOG before changing anything, so a refusal leaves the tree untouched.
let changelog;
try {
  changelog = releaseChangelog(readFileSync('CHANGELOG.md', 'utf8'), next, today(), parseRepo(pkg.repository).url);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

npm(`version ${kind} --no-git-tag-version --ignore-scripts`);
const bumped = JSON.parse(readFileSync('package.json', 'utf8')).version;
if (bumped !== next) fail(`npm version produced ${bumped}, expected ${next}`);
writeFileSync('CHANGELOG.md', changelog);
npm('run build:lib');
npm('run api:report');

console.log(`
Prepared ${next} on ${branch} (${pkg.version} -> ${next}).
Changed: package.json, package-lock.json, CHANGELOG.md, docs/api-surface.md.

Next steps:
  1. Review the diff (git diff), especially CHANGELOG.md and docs/api-surface.md.
  2. git commit -am "Release ${next}" && git push -u origin ${branch}
  3. Open a pull request into main. Merge it once ci-status passes.
  4. On main: git switch main && git pull, then npm run release:tag
`);
