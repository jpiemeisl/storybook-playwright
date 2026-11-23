/*
 * Runtime validation of content, without dependencies. Pure functions: no DOM, no React.
 * Used by BlockRenderer for error reporting and exported for adapter authors.
 */
import { blockTypes, type Block, type PageContent } from '../content-types/blocks';
import { Checker, isNonEmptyString, isObj, type Obj, type ValidationIssue } from './checker';
import { isSafeAnchorId, isSafeImageSrc } from './links';
import { builtInTemplates, validateTemplateFields } from './validateTemplates';

export { FATAL_CODES, isFatal, isIsoDate, type IssueCode, type ValidationIssue } from './checker';

const backgrounds = ['default', 'subtle', 'accent', 'inverse'] as const;
const paddings = ['none', 'sm', 'md', 'lg'] as const;
const columns = [2, 3, 4] as const;

const action = (c: Checker, key: string, required = false) =>
  c.child(key, required, (a) => {
    a.str('label');
    a.href('href');
    a.oneOf('variant', ['primary', 'secondary', 'ghost']);
  });

const rules: Record<Block['type'], (c: Checker) => void> = {
  hero: (c) => {
    c.str('headline');
    c.str('subhead', false);
    action(c, 'primaryAction');
    action(c, 'secondaryAction');
    c.oneOf('variant', ['centered', 'split', 'background']);
    c.oneOf('mediaPosition', ['start', 'end']);
    c.image('media', c.value.variant === 'background');
  },
  pageHeader: (c) => {
    c.str('title');
    c.str('description', false);
    c.each('breadcrumbs', 0, 8, (b) => {
      b.str('label');
      b.href('href', false);
    });
    c.child('author', false, (a) => {
      a.str('name');
      a.image('avatar');
      a.href('href', false);
    });
    c.str('publishedAt', false);
    c.each('actions', 0, 2, (a) => {
      a.str('label');
      a.href('href');
    });
    c.image('media');
    c.oneOf('variant', ['default', 'centered', 'with-media']);
  },
  featureGrid: (c) => {
    c.str('heading', false);
    c.each('items', 1, 12, (i) => {
      i.str('title');
      i.str('description', false);
      i.link('link');
    });
    c.oneOf('columns', columns);
    c.oneOf('layout', ['stacked', 'inline-icon']);
  },
  cardGrid: (c) => {
    c.each('items', 1, 12, (i) => {
      i.str('title');
      i.image('image');
      i.link('link');
    });
    c.oneOf('columns', columns);
    c.oneOf('variant', ['elevated', 'outlined', 'flat']);
  },
  articleCardGrid: (c) => {
    c.each('items', 1, 12, (i) => {
      i.str('title');
      i.href('href');
      i.str('publishedAt');
      i.image('image');
      i.child('author', false, (a) => {
        a.str('name');
        a.image('avatar');
      });
    });
  },
  mediaText: (c) => {
    c.str('heading');
    c.richText('body', false);
    c.image('media', true);
    c.each('actions', 0, 2, (a) => {
      a.str('label');
      a.href('href');
    });
    c.oneOf('mediaPosition', ['start', 'end']);
    c.oneOf('mediaWidth', ['balanced', 'wide']);
  },
  ctaBanner: (c) => {
    c.str('heading');
    action(c, 'primaryAction', true);
    action(c, 'secondaryAction');
    c.oneOf('variant', ['accent', 'inverse', 'subtle']);
    c.oneOf('layout', ['centered', 'split']);
  },
  stats: (c) => {
    c.each('items', 2, 8, (i) => {
      i.str('value');
      i.str('label');
    });
    c.oneOf('columns', columns);
  },
  testimonial: (c) => {
    c.child('testimonial', true, (t) => {
      t.str('quote');
      t.child('author', true, (a) => {
        a.str('name');
        a.image('avatar');
      });
      t.image('companyLogo');
    });
  },
  testimonialGrid: (c) => {
    c.each('items', 1, 3, (t) => {
      t.str('quote');
      t.child('author', true, (a) => a.str('name'));
    });
  },
  logoStrip: (c) => {
    c.each('items', 1, 12, (i) => {
      i.str('name');
      i.image('image', true, false);
      i.href('href', false);
    });
  },
  faq: (c) => {
    c.each('items', 1, 30, (i) => {
      i.str('id');
      i.str('question');
      i.richText('answer');
    });
  },
  pricingTable: (c) => {
    c.each('tiers', 1, 4, (t) => {
      t.str('id');
      t.str('name');
      if (!('price' in t.value)) t.report('missing-field', 'price', '"price" is required (use null for "Custom").');
      t.oneOf('interval', ['month', 'year', 'one-time']);
      t.each('features', 0, 30, (f) => f.str('label'));
      t.link('cta', true);
    });
  },
  richText: (c) => {
    c.richText('content');
    c.oneOf('size', ['base', 'large']);
  },
  gallery: (c) => {
    c.each('images', 1, 48, (i) => {
      if (!isNonEmptyString(i.value.src)) i.report('missing-field', 'src', '"src" is required.');
      else if (!isSafeImageSrc(i.value.src)) i.report('unsafe-src', 'src', `Unsafe image source ${JSON.stringify(i.value.src)}.`);
      if (typeof i.value.alt !== 'string') i.report('missing-alt', 'alt', 'Image alt text is required.');
      i.num('width', true);
      i.num('height', true);
    });
    c.oneOf('layout', ['grid', 'columns']);
    c.oneOf('columns', columns);
  },
  videoEmbed: (c) => {
    c.oneOf('provider', ['youtube', 'vimeo', 'generic']);
    c.str('title');
    if (c.value.provider === 'generic') c.href('src');
    else c.str('videoId');
    c.image('poster');
  },
  mapEmbed: (c) => {
    c.href('src');
    c.str('title');
    c.str('address');
    c.href('directionsHref');
    c.image('placeholder');
  },
  team: (c) => {
    c.each('members', 1, 24, (m) => {
      m.str('name');
      m.image('photo');
      m.each('social', 0, 8, (s) => {
        s.str('label');
        s.href('href');
      });
    });
    c.oneOf('columns', columns);
  },
  timeline: (c) => {
    c.each('items', 1, 24, (i) => {
      i.str('label');
      i.str('title');
    });
  },
  steps: (c) => {
    c.each('items', 2, 8, (i) => i.str('title'));
    c.num('currentStep');
  },
  tabs: (c) => {
    c.str('label');
    c.each('tabs', 2, 8, (t) => {
      t.str('id');
      t.str('label');
      const { richText, blocks } = t.value;
      if (richText === undefined && blocks === undefined) t.report('missing-field', 'richText', 'A tab needs "richText" or "blocks".');
      if (richText !== undefined) t.richText('richText');
      if (blocks !== undefined) {
        t.each('blocks', 0, 12, (b) => {
          if (b.value.type === 'tabs') b.report('nested-tabs', 'type', 'Tabs cannot contain tabs (nesting is limited to one level).');
          else validateInto(b.value, b, false);
        });
      }
    });
  },
  table: (c) => {
    c.str('caption');
    c.each('columns', 1, 16, (col) => {
      col.str('key');
      col.str('header');
    });
    c.each('rows', 0, 500, () => {});
  },
  contactForm: (c) => {
    c.each('subjectOptions', 1, 20, (o) => {
      o.str('value');
      o.str('label');
    });
  },
  newsletterSignup: (c) => {
    c.oneOf('layout', ['inline', 'stacked']);
  },
  divider: (c) => {
    c.str('label', false);
  },
  spacer: (c) => {
    if (c.value.size === undefined) c.report('missing-field', 'size', '"size" is required.');
    c.oneOf('size', ['sm', 'md', 'lg', 'xl']);
  },
};

/** Options for validateBlock and validatePage: the block types and template names to treat as known. */
export interface ValidateOptions {
  /** Block types the registry can render. Default: the built-in types. */
  knownTypes?: readonly string[];
  /** Template names the templates registry knows. Default: the built-in templates. */
  knownTemplates?: readonly string[];
}

/** Shared by top-level and nested (tab) blocks. `checker` writes issues at the right path. */
function validateInto(block: Obj, checker: Checker, topLevel: boolean, knownTypes: readonly string[] = blockTypes) {
  checker.str('id');
  checker.str('type');
  const type = block.type;
  if (typeof type === 'string' && !knownTypes.includes(type)) {
    checker.report('unknown-type', 'type', `Unknown block type "${type}". Add it to the registry with createRegistry().`);
    return;
  }
  if (block.anchorId !== undefined && !isSafeAnchorId(block.anchorId)) {
    checker.report('unsafe-anchor', 'anchorId', `anchorId ${JSON.stringify(block.anchorId)} is not a safe fragment (letters, digits, - and _; start with a letter).`);
  }
  checker.oneOf('background', backgrounds);
  checker.oneOf('padding', paddings);
  const rule = rules[type as Block['type']];
  if (rule) rule(checker);
  void topLevel;
}

/** Validates one block. Unknown types are reported unless listed in `knownTypes` (custom blocks validate only their base fields). */
export function validateBlock(block: unknown, options: ValidateOptions = {}, path = ''): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isObj(block)) {
    issues.push({ code: 'invalid-field', severity: 'error', message: 'A block must be an object.', path });
    return issues;
  }
  const meta = { blockId: typeof block.id === 'string' ? block.id : undefined, blockType: typeof block.type === 'string' ? block.type : undefined };
  validateInto(block, new Checker(block, path, issues, meta), true, options.knownTypes ?? blockTypes);
  return issues;
}

/** Template data holding blocks of its own (rendered on the same page as `blocks`). */
const bodyPaths = [
  ['article', 'body'],
  ['caseStudy', 'body'],
] as const;

/** Lists of blocks on the page with their paths: `blocks` plus any template body. */
function blockLists(page: Obj): { blocks: unknown[]; path: string }[] {
  const lists: { blocks: unknown[]; path: string }[] = [];
  for (const [key, field] of bodyPaths) {
    const holder = page[key];
    if (isObj(holder) && Array.isArray(holder[field])) lists.push({ blocks: holder[field], path: `${key}.${field}` });
  }
  if (Array.isArray(page.blocks)) lists.push({ blocks: page.blocks, path: 'blocks' });
  return lists;
}

/** Collects every block id on the page, including template bodies and blocks nested in tabs, with their paths. */
function collectIds(page: Obj): { id: string; path: string; type?: string }[] {
  const ids: { id: string; path: string; type?: string }[] = [];
  for (const list of blockLists(page)) {
    (list.blocks as PageContent['blocks']).forEach((block, i) => {
      if (!isObj(block)) return;
      ids.push({ id: String(block.id), path: `${list.path}[${i}].id`, type: block.type });
      if (block.type === 'tabs' && Array.isArray(block.tabs)) {
        block.tabs.forEach((tab, t) =>
          tab?.blocks?.forEach((nested, n) => ids.push({ id: String(nested?.id), path: `${list.path}[${i}].tabs[${t}].blocks[${n}].id`, type: nested?.type })),
        );
      }
    });
  }
  return ids;
}

/**
 * Validates page metadata, every block, duplicate block ids and anchor ids, and the template: its
 * name and the structured data it needs (required fields, ISO dates, pagination, listing links).
 */
export function validatePage(page: unknown, options: ValidateOptions = {}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isObj(page)) return [{ code: 'invalid-field', severity: 'error', message: 'A page must be an object.', path: '' }];
  const c = new Checker(page, '', issues, {});
  c.str('id');
  // The home page's slug is legitimately empty, so only the type is checked.
  if (typeof page.slug !== 'string') c.report('missing-field', 'slug', '"slug" is required (use "" for the home page).');
  c.child('seo', true, (seo) => {
    seo.str('title');
    seo.image('ogImage');
  });
  if (!Array.isArray(page.blocks)) {
    c.report('invalid-field', 'blocks', '"blocks" must be a list (it may be empty).');
    return issues;
  }
  page.blocks.forEach((block, i) => issues.push(...validateBlock(block, options, `blocks[${i}]`)));
  validateTemplateFields(
    c,
    (blocks, path) => (blocks as unknown[]).flatMap((block, i) => validateBlock(block, options, `${path}[${i}]`)),
    options.knownTemplates ?? builtInTemplates,
  );

  const seen = new Map<string, string>();
  for (const { id, path, type } of collectIds(page)) {
    const first = seen.get(id);
    if (first) issues.push({ code: 'duplicate-id', severity: 'error', message: `Block id "${id}" is already used at ${first}. Ids must be unique per page.`, path, blockId: id, blockType: type });
    else seen.set(id, path);
  }
  const anchors = new Set<string>();
  for (const list of blockLists(page)) {
    list.blocks.forEach((block, i) => {
      if (!isObj(block) || typeof block.anchorId !== 'string') return;
      if (anchors.has(block.anchorId)) {
        issues.push({ code: 'duplicate-id', severity: 'error', message: `anchorId "${block.anchorId}" is used twice; element ids must be unique.`, path: `${list.path}[${i}].anchorId`, blockId: String(block.id), blockType: String(block.type) });
      } else anchors.add(block.anchorId);
    });
  }
  return issues;
}

/** Returns only the issues with severity "error", dropping warnings. Pure; the input array is not changed. */
export const errorsOnly = (issues: ValidationIssue[]) => issues.filter((issue) => issue.severity === 'error');
