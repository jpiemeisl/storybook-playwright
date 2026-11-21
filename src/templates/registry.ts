import type { PageContent } from '../content-types/blocks';
import type { ValidationIssue } from '../registry/checker';
import { BlogIndex, canRenderBlogIndex } from './BlogIndex';
import { BlogPost, canRenderBlogPost } from './BlogPost';
import { CaseStudy, canRenderCaseStudy } from './CaseStudy';
import { CaseStudyIndex, canRenderCaseStudyIndex } from './CaseStudyIndex';
import { DefaultTemplate } from './DefaultTemplate';
import { ErrorPage, canRenderErrorPage } from './ErrorPage';
import { Landing } from './Landing';
import { Legal, canRenderLegal } from './Legal';
import { SearchResults, canRenderSearch } from './SearchResults';
import { ThankYou, canRenderThankYou } from './ThankYou';
import { defineTemplate, type TemplateDefinition, type Templates } from './types';

const composed = (name: string, label: string, description: string) => defineTemplate({ name, label, description, component: DefaultTemplate });

/** The built-in templates. Composed templates all use DefaultTemplate; the page's blocks make the difference. */
export const defaultTemplates: Templates = {
  default: composed('default', 'Default', 'Blocks inside the site chrome.'),
  home: composed('home', 'Home', 'Home page: usually a hero followed by sections.'),
  about: composed('about', 'About', 'About page: page header, story, team.'),
  services: composed('services', 'Services index', 'Overview of services.'),
  'service-detail': composed('service-detail', 'Service detail', 'One service: what is included, FAQ, call to action.'),
  pricing: composed('pricing', 'Pricing', 'Plans and comparison.'),
  contact: composed('contact', 'Contact', 'Contact form, map and FAQ.'),
  'blog-index': defineTemplate({ name: 'blog-index', label: 'Blog index', description: 'Listing of posts with categories and pagination.', component: BlogIndex, canRender: canRenderBlogIndex }),
  'blog-post': defineTemplate({ name: 'blog-post', label: 'Blog post', description: 'Article with table of contents, author and related posts.', component: BlogPost, canRender: canRenderBlogPost }),
  'case-study-index': defineTemplate({ name: 'case-study-index', label: 'Case study index', description: 'Listing of case studies with filters.', component: CaseStudyIndex, canRender: canRenderCaseStudyIndex }),
  'case-study': defineTemplate({ name: 'case-study', label: 'Case study', description: 'Client, results, story and next/previous links.', component: CaseStudy, canRender: canRenderCaseStudy }),
  landing: defineTemplate({ name: 'landing', label: 'Landing page', description: 'Blocks only, minimal chrome, optional sticky call to action.', component: Landing }),
  legal: defineTemplate({ name: 'legal', label: 'Legal', description: 'Long legal text with table of contents and print styles.', component: Legal, canRender: canRenderLegal }),
  search: defineTemplate({ name: 'search', label: 'Search results', description: 'Search form (GET) and results passed in as data.', component: SearchResults, canRender: canRenderSearch }),
  error: defineTemplate({ name: 'error', label: 'Error page', description: '404, 500 and 503 pages.', component: ErrorPage, canRender: canRenderErrorPage }),
  'thank-you': defineTemplate({ name: 'thank-you', label: 'Thank you', description: 'Confirmation with next steps.', component: ThankYou, canRender: canRenderThankYou }),
};

/**
 * The built-in templates plus `overrides`, which replace a template with the same name or add a new
 * one. The default templates record is not modified.
 */
export function createTemplates(overrides: TemplateDefinition[] = [], base: Templates = defaultTemplates): Templates {
  return { ...base, ...Object.fromEntries(overrides.map((definition) => [definition.name, definition])) };
}

/**
 * The template for `name`. A missing name means "default"; an unknown name falls back to "default"
 * and is reported through `onError`.
 */
export function getTemplate(name: string | undefined, templates: Templates = defaultTemplates, onError?: (issue: ValidationIssue) => void): TemplateDefinition {
  const fallback = templates.default ?? defaultTemplates.default!;
  if (name === undefined || name === '') return fallback;
  const definition = Object.hasOwn(templates, name) ? templates[name] : undefined;
  if (definition) return definition;
  onError?.({ code: 'unknown-template', severity: 'warning', message: `Unknown template "${name}"; rendered with the default template.`, path: 'template' });
  return fallback;
}

/** getTemplate plus the template's own canRender check: pages missing their structured data fall back to default. */
export function resolveTemplate(page: PageContent, templates: Templates = defaultTemplates): { definition: TemplateDefinition; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const definition = getTemplate(page.template, templates, (issue) => issues.push(issue));
  if (definition.canRender && !safely(() => definition.canRender!(page))) {
    issues.push({ code: 'missing-field', severity: 'error', message: `The page is missing the data the "${definition.name}" template needs; rendered with the default template.`, path: 'template' });
    return { definition: templates.default ?? defaultTemplates.default!, issues };
  }
  return { definition, issues };
}

function safely(check: () => boolean): boolean {
  try {
    return check();
  } catch {
    return false;
  }
}
