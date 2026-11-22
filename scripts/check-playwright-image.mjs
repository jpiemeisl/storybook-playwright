#!/usr/bin/env node
/*
 * Fails when docker/image.json is out of step with the installed @playwright/test (package-lock.json):
 * the pinned version, the tag (v<version>-noble) and a sha256 digest must all be present and agree.
 */
import { readFileSync } from 'node:fs';

const image = JSON.parse(readFileSync('docker/image.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const installed = lock.packages?.['node_modules/@playwright/test']?.version;
const problems = [];
if (!installed) problems.push('@playwright/test is not in package-lock.json');
if (image.playwright !== installed) problems.push(`docker/image.json pins Playwright ${image.playwright}, but @playwright/test ${installed} is installed`);
if (image.tag !== `v${image.playwright}-noble`) problems.push(`tag "${image.tag}" should be "v${image.playwright}-noble"`);
if (!/^sha256:[0-9a-f]{64}$/.test(image.digest ?? '')) problems.push('digest must be a sha256 image digest');
if (/latest/.test(image.tag ?? '')) problems.push('never use a "latest" tag');
if (problems.length) {
  console.error(`check:playwright-image failed:\n${problems.map((p) => `  - ${p}`).join('\n')}\nUpdate docker/image.json (tag, digest, playwright) together with the package; see docs/testing.md.`);
  process.exit(1);
}
console.log(`Playwright image OK: ${image.image}:${image.tag}@${image.digest.slice(0, 19)}… matches @playwright/test ${installed}.`);
