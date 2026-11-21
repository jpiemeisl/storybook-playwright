/*
 * Contract tests for the JSON fixtures: every page and block example must validate, map and render
 * with the default registry, and survive a JSON round trip unchanged. Edge-case pages must produce
 * exactly the issues they exist to demonstrate.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { blockTypes, type Block, type BlockType, type PageContent } from '../content-types/blocks';
import { renderBlocks } from '../registry/BlockRenderer';
import { defaultRegistry } from '../registry/registry';
import type { BlockLike } from '../registry/types';
import { errorsOnly, validateBlock, validatePage, type IssueCode, type ValidationIssue } from '../registry/validate';

const load = <T,>(modules: Record<string, { default: T }>) =>
  Object.fromEntries(Object.entries(modules).map(([path, mod]) => [path.replace(/^.*\/(.+)\.json$/, '$1'), mod.default]));

const pages = load<PageContent>(import.meta.glob('./pages/*.json', { eager: true }));
const blocks = load<Block>(import.meta.glob('./blocks/*.json', { eager: true }));

function pick<T>(record: Record<string, T>, name: string): T {
  const value = record[name];
  if (value === undefined) throw new Error(`Missing fixture: ${name}`);
  return value;
}
const page = (name: string) => pick(pages, name);
const block = (name: string) => pick(blocks, name);

const MAIN_PAGES = ['home', 'about', 'services', 'service-detail', 'pricing', 'contact', 'blog-index', 'blog-post', 'case-study', 'landing', 'legal', 'not-found'];
const CLEAN_EDGE_CASES = ['empty', 'single-block', 'all-blocks', 'forty-blocks', 'long-text'];

/** Renders through the real registry (toProps + components) and returns every issue reported. */
function renderIssues(list: readonly BlockLike[]): ValidationIssue[] {
  const { nodes, issues } = renderBlocks(list, { registry: defaultRegistry, context: {}, showErrors: true });
  renderToStaticMarkup(createElement('div', null, ...nodes));
  return issues;
}

const codes = (issues: ValidationIssue[]) => issues.map((issue) => `${issue.blockId ?? ''}:${issue.code}`).sort();

describe('page fixtures', () => {
  it('include every required page and edge case', () => {
    expect(Object.keys(pages).sort()).toEqual(
      [...MAIN_PAGES, ...CLEAN_EDGE_CASES, 'unknown-block', 'broken-block', 'duplicate-ids', 'unsafe-link'].sort(),
    );
  });

  it.each([...MAIN_PAGES, ...CLEAN_EDGE_CASES])('%s validates and renders with no issues at all', (name) => {
    expect(validatePage(page(name))).toEqual([]);
    expect(renderIssues(page(name).blocks)).toEqual([]);
  });

  it.each(Object.keys(pages))('%s survives a JSON round trip unchanged', (name) => {
    expect(JSON.parse(JSON.stringify(page(name)))).toEqual(page(name));
  });

  it('use local images only', () => {
    const text = JSON.stringify(pages) + JSON.stringify(blocks);
    const imageSrcs = [...text.matchAll(/"(?:src|url)":"([^"]+)"/g)].map((m) => m[1] ?? '');
    // The map embed is click-to-load (no request until the user asks), so it is the one remote src.
    expect(imageSrcs.filter((src) => /^https?:/.test(src) && !src.startsWith('https://maps.example/'))).toEqual([]);
  });

  it('all-blocks uses every block type', () => {
    expect(new Set(page('all-blocks').blocks.map((b) => b.type))).toEqual(new Set(blockTypes));
  });

  it('forty-blocks has 40 blocks', () => {
    expect(page('forty-blocks').blocks).toHaveLength(40);
  });

  it('every main page starts with a block that renders the h1', () => {
    for (const name of MAIN_PAGES) {
      expect(['hero', 'pageHeader'], name).toContain(page(name).blocks[0]?.type);
    }
  });
});

describe('edge-case fixtures report what they demonstrate', () => {
  const expectIssues = (name: string, expected: `${string}:${IssueCode}`[]) => {
    const issues = [...validatePage(page(name)), ...renderIssues(page(name).blocks)];
    expect(codes(issues)).toEqual([...expected].sort());
  };

  it('unknown-block: one unknown-type issue (from validation and again at render)', () => {
    expectIssues('unknown-block', ['mystery:unknown-type', 'mystery:unknown-type']);
  });

  it('broken-block: the missing headline and missing action are reported', () => {
    const issues = errorsOnly(validatePage(page('broken-block')));
    expect(codes(issues)).toEqual(['broken-cta:missing-field', 'broken-hero:missing-field']);
  });

  it('duplicate-ids: the repeated id and the repeated anchorId are reported', () => {
    expect(codes(validatePage(page('duplicate-ids')))).toEqual(['dup-cta:duplicate-id', 'dup:duplicate-id']);
    // The renderer keeps only the first use of an anchorId, so the DOM never has duplicate ids.
    const { nodes, issues } = renderBlocks(page('duplicate-ids').blocks, { registry: defaultRegistry, context: {}, showErrors: true });
    expect(codes(issues)).toEqual(['dup-cta:duplicate-id']);
    expect(renderToStaticMarkup(createElement('div', null, ...nodes)).match(/id="numbers"/g)).toHaveLength(1);
  });

  it('unsafe-link: every javascript:/data: link is reported and none survives into the markup', () => {
    const unsafe = page('unsafe-link');
    const validation = validatePage(unsafe).filter((issue) => issue.code === 'unsafe-href');
    expect(validation.map((issue) => issue.blockId).sort()).toEqual(['x-cards', 'x-features', 'x-hero', 'x-text']);
    const { nodes, issues } = renderBlocks(unsafe.blocks, { registry: defaultRegistry, context: {}, showErrors: true });
    const html = renderToStaticMarkup(createElement('div', null, ...nodes));
    expect(html).not.toMatch(/(?:href|src)="\s*(?:javascript|data):/i);
    expect(html).toContain('link that runs script');
    expect(issues.filter((issue) => issue.code === 'unsafe-href').length).toBeGreaterThanOrEqual(4);
  });
});

describe('block fixtures', () => {
  it('there is one example per block type, named after it', () => {
    expect(Object.keys(blocks).sort()).toEqual([...blockTypes].sort());
    for (const [name, block] of Object.entries(blocks)) expect(block.type).toBe(name as BlockType);
  });

  it.each(Object.keys(blocks))('%s validates and renders with no issues', (name) => {
    expect(validateBlock(block(name))).toEqual([]);
    expect(renderIssues([block(name)])).toEqual([]);
  });
});
