/*
 * Template-specific page validation, called by validatePage. Checks the structured data each
 * template needs (required fields, ISO dates, pagination, unsafe links in listings). Pure.
 */
import { composedTemplates, type TemplateName } from '../content-types/templates';
import { Checker, isObj, type ValidationIssue } from './checker';

/** Every template name the built-in templates registry understands. */
export const builtInTemplates: readonly TemplateName[] = [
  ...composedTemplates,
  'blog-index',
  'blog-post',
  'case-study-index',
  'case-study',
  'landing',
  'legal',
  'search',
  'error',
  'thank-you',
];

type ValidateBlocks = (blocks: unknown, path: string) => ValidationIssue[];

const breadcrumbs = (c: Checker) =>
  c.each('breadcrumbs', 0, 8, (b) => {
    b.str('label');
    b.href('href', false);
  });

const heading = (c: Checker) =>
  c.child('heading', true, (h) => {
    h.str('title');
    h.str('description', false);
    breadcrumbs(h);
  });

const action = (c: Checker, key: string, required = false) =>
  c.child(key, required, (a) => {
    a.str('label');
    a.href('href');
    a.oneOf('variant', ['primary', 'secondary', 'ghost']);
  });

const author = (c: Checker, key: string, required: boolean) =>
  c.child(key, required, (a) => {
    a.str('name');
    a.str('role', false);
    a.href('href', false);
    a.image('avatar', false, false);
  });

const articleSummary = (c: Checker) => {
  c.str('id');
  c.str('title');
  c.href('href');
  c.str('excerpt', false);
  c.image('image');
  c.str('category', false);
  c.date('publishedAt');
  c.num('readingTime');
  author(c, 'author', false);
};

const categories = (c: Checker, key: string) =>
  c.each(key, 0, 20, (item) => {
    item.str('id');
    item.str('label');
    item.href('href');
    item.num('count');
  });

/** currentPage and totalPages are whole numbers with 1 <= currentPage <= totalPages. */
const pagination = (c: Checker) =>
  c.child('pagination', true, (p) => {
    p.num('currentPage', true);
    p.num('totalPages', true);
    p.href('basePath');
    const { currentPage, totalPages } = p.value;
    if (typeof currentPage !== 'number' || typeof totalPages !== 'number') return;
    if (!Number.isInteger(totalPages) || totalPages < 1) {
      p.report('invalid-pagination', 'totalPages', `"totalPages" must be a whole number of at least 1; got ${totalPages}.`);
    } else if (!Number.isInteger(currentPage) || currentPage < 1 || currentPage > totalPages) {
      p.report('invalid-pagination', 'currentPage', `"currentPage" must be a whole number from 1 to ${totalPages}; got ${currentPage}.`);
    }
  });

/** Item ids must be unique within a listing. */
const uniqueIds = (c: Checker, key: string, extra: unknown[] = []) => {
  const items = c.value[key];
  if (!Array.isArray(items)) return;
  const seen = new Set<string>();
  [...extra, ...items].forEach((item, index) => {
    if (!isObj(item) || typeof item.id !== 'string') return;
    if (seen.has(item.id)) c.report('duplicate-id', `${key}[${index - extra.length}].id`, `Item id "${item.id}" is used more than once in this listing.`);
    seen.add(item.id);
  });
};

/** An active category/filter id must be one of the listed ones. */
const activeId = (c: Checker, listKey: string, idKey: string) => {
  const id = c.value[idKey];
  const list = c.value[listKey];
  if (typeof id !== 'string' || !Array.isArray(list)) return;
  if (!list.some((item) => isObj(item) && item.id === id)) c.report('invalid-field', idKey, `"${idKey}" is "${id}", which is not one of the ${listKey}.`, 'warning');
};

const bodyBlocks = (c: Checker, validateBlocks: ValidateBlocks) => {
  const body = c.value.body;
  if (!Array.isArray(body)) {
    c.report(body === undefined ? 'missing-field' : 'invalid-field', 'body', '"body" must be a list of blocks.');
    return;
  }
  c.issues.push(...validateBlocks(body, c.at('body')));
};

const rules: Partial<Record<TemplateName, (c: Checker, validateBlocks: ValidateBlocks) => void>> = {
  'blog-index': (c) => {
    heading(c);
    c.child('listing', true, (l) => {
      l.each('items', 0, 48, articleSummary);
      l.child('featured', false, articleSummary);
      uniqueIds(l, 'items', l.value.featured ? [l.value.featured] : []);
      categories(l, 'categories');
      activeId(l, 'categories', 'activeCategoryId');
      l.href('allPostsHref', false);
      pagination(l);
    });
  },
  'blog-post': (c, validateBlocks) => {
    c.child('article', true, (a) => {
      a.str('title');
      a.str('excerpt', false);
      author(a, 'author', true);
      a.date('publishedAt');
      a.num('readingTime');
      a.each('tags', 0, 12, (t) => {
        t.str('label');
        t.href('href', false);
      });
      a.image('heroImage');
      breadcrumbs(a);
      a.href('shareUrl', false);
      bodyBlocks(a, validateBlocks);
      a.each('related', 0, 4, articleSummary);
    });
  },
  'case-study-index': (c) => {
    heading(c);
    c.child('listing', true, (l) => {
      l.each('items', 0, 48, (item) => {
        item.str('id');
        item.str('title');
        item.href('href');
        item.str('client');
        item.str('summary', false);
        item.image('image');
        item.str('keyResult', false);
      });
      uniqueIds(l, 'items');
      categories(l, 'filters');
      activeId(l, 'filters', 'activeFilterId');
      l.href('allHref', false);
      pagination(l);
    });
  },
  'case-study': (c, validateBlocks) => {
    c.child('caseStudy', true, (s) => {
      s.str('title');
      s.str('summary', false);
      s.str('client');
      s.str('industry', false);
      s.strings('services');
      breadcrumbs(s);
      s.image('heroImage');
      s.each('results', 0, 4, (r) => {
        r.str('value');
        r.str('label');
      });
      bodyBlocks(s, validateBlocks);
      s.link('previous');
      s.link('next');
    });
  },
  legal: (c) => {
    c.child('legal', true, (l) => {
      l.str('title');
      l.str('intro', false);
      l.date('lastUpdated');
      breadcrumbs(l);
      l.richText('body');
    });
  },
  search: (c) => {
    c.child('search', true, (s) => {
      if (typeof s.value.query !== 'string') s.report('missing-field', 'query', '"query" is required (use "" before the user has searched).');
      s.num('total', true);
      s.each('results', 0, 50, (r) => {
        r.str('id');
        r.str('title');
        r.href('url');
        r.str('excerpt', false);
        r.str('type', false);
        r.each('trail', 0, 8, (b) => {
          b.str('label');
          b.href('href', false);
        });
      });
      uniqueIds(s, 'results');
      pagination(s);
      s.href('action', false);
      s.strings('suggestions');
      s.link('contactLink');
    });
  },
  error: (c) => {
    c.child('error', true, (e) => {
      if (e.value.code === undefined) e.report('missing-field', 'code', '"code" is required (404, 500 or 503).');
      e.oneOf('code', [404, 500, 503]);
      e.str('title');
      e.str('message');
      action(e, 'primaryAction', true);
      action(e, 'secondaryAction');
      e.each('links', 0, 8, (l) => {
        l.str('label');
        l.href('href');
      });
      e.href('searchAction', false);
      e.oneOf('layout', ['default', 'minimal']);
    });
  },
  'thank-you': (c) => {
    c.child('thankYou', true, (t) => {
      t.str('title');
      t.str('message');
      t.each('steps', 0, 6, (s) => s.str('title'));
      t.each('actions', 0, 2, (a) => {
        a.str('label');
        a.href('href');
        a.oneOf('variant', ['primary', 'secondary', 'ghost']);
      });
      t.each('links', 0, 8, (l) => {
        l.str('label');
        l.href('href');
      });
    });
  },
  landing: (c) => {
    action(c, 'stickyCta');
    c.str('stickyCtaMessage', false);
  },
};

/**
 * Validates the template name and the template's structured data. A missing template is checked as
 * `default`. Composed templates (blocks only) get a warning when no block can provide the page's h1.
 */
export function validateTemplateFields(c: Checker, validateBlocks: ValidateBlocks, knownTemplates: readonly string[] = builtInTemplates) {
  // A page without a template renders with the default template, so it gets the same checks.
  // The fallback skips the known-name check, so a custom knownTemplates list needn't include it.
  const declared = c.value.template;
  const template = declared ?? 'default';
  if (typeof template !== 'string' || (declared !== undefined && !knownTemplates.includes(template))) {
    c.report('unknown-template', 'template', `Unknown template ${JSON.stringify(template)}; the default template will be used.`, 'warning');
    return;
  }
  if ((composedTemplates as readonly string[]).includes(template) || template === 'landing') {
    const blocks = Array.isArray(c.value.blocks) ? c.value.blocks : [];
    if (!blocks.some((block) => isObj(block) && (block.type === 'hero' || block.type === 'pageHeader'))) {
      c.report('missing-field', 'blocks', 'Start the page with a hero or pageHeader block: it provides the page’s h1.', 'warning');
    }
  }
  rules[template as TemplateName]?.(c, validateBlocks);
}
