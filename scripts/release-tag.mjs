#!/usr/bin/env node
/*
 * npm run release:tag [-- --confirm-ci]
 * Creates the annotated tag v<version> for HEAD of main and pushes only that tag, which starts
 * .github/workflows/release.yml. Refuses unless:
 *   - the current branch is main, the working tree is clean, and local main equals origin/main;
 *   - package.json's version has no tag yet (locally or on origin);
 *   - CHANGELOG.md has notes for that version;
 *   - the ci-status check passed for HEAD (GitHub API via gh). Without gh, check it yourself and pass
 *     --confirm-ci. The release workflow verifies ci-status again either way.
 * See docs/publishing.md.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { changelogSection, ciStatusVerdict, parseRepo, tagFor } from './release.mjs';

const fail = (message) => {
  console.error(`\nrelease:tag: ${message}\n`);
  process.exit(1);
};
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const ok = (message) => console.log(`  ok  ${message}`);

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const { owner, repo, url } = parseRepo(pkg.repository);
const version = pkg.version;
const tag = tagFor(version);
console.log(`Releasing ${pkg.name}@${version} as ${tag}\n`);

const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
if (branch !== 'main') fail(`Releases are tagged on main; you are on "${branch}". git switch main && git pull`);
ok('on main');
if (git('status', '--porcelain', '--untracked-files=no')) fail('The working tree has uncommitted changes.');
ok('working tree clean');

git('fetch', '--quiet', '--tags', 'origin', 'main');
const head = git('rev-parse', 'HEAD');
const remote = git('rev-parse', 'origin/main');
if (head !== remote) fail(`Local main (${head.slice(0, 7)}) differs from origin/main (${remote.slice(0, 7)}). git pull (or drop local commits) first.`);
ok(`main equals origin/main (${head.slice(0, 7)})`);

if (git('tag', '--list', tag) || git('ls-remote', '--tags', 'origin', `refs/tags/${tag}`)) {
  fail(`Tag ${tag} already exists. A released version is never re-tagged: prepare the next version with npm run release:prepare.`);
}
ok(`${tag} is not tagged yet`);

if (!changelogSection(readFileSync('CHANGELOG.md', 'utf8'), version)) fail(`CHANGELOG.md has no notes under "## [${version}]". Run npm run release:prepare on a release branch.`);
ok(`CHANGELOG.md has notes for ${version}`);

const manual = [
  `Check it by hand: open ${url}/commit/${head} and confirm the ci-status check is green,`,
  `or: curl -s "https://api.github.com/repos/${owner}/${repo}/commits/${head}/check-runs?check_name=ci-status"`,
  'Then run npm run release:tag -- --confirm-ci',
].join('\n  ');
const gh = spawnSync('gh', ['api', `repos/${owner}/${repo}/commits/${head}/check-runs?check_name=ci-status&per_page=100`], { encoding: 'utf8', shell: false });
if (gh.error?.code === 'ENOENT') {
  if (!process.argv.includes('--confirm-ci')) fail(`gh (GitHub CLI) is not installed, so ci-status cannot be checked automatically.\n  ${manual}`);
  console.log(`  --   gh is not installed; ci-status confirmed by hand (--confirm-ci). The release workflow checks it again.`);
} else if (gh.status !== 0) {
  fail(`gh could not read the check runs (${(gh.stderr || '').trim() || `exit ${gh.status}`}). Run gh auth login, or:\n  ${manual}`);
} else {
  const verdict = ciStatusVerdict(JSON.parse(gh.stdout), head.slice(0, 7));
  if (!verdict.ok) fail(verdict.message);
  ok(verdict.message);
}

git('tag', '--annotate', tag, '--message', `${pkg.name} ${version}`);
try {
  git('push', 'origin', `refs/tags/${tag}`);
} catch (error) {
  git('tag', '--delete', tag);
  fail(`Pushing ${tag} failed, so the local tag was removed again. ${error.message}`);
}
console.log(`\nPushed ${tag}. The release workflow is running: ${url}/actions/workflows/release.yml\n`);
