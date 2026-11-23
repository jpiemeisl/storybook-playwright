# CMS integration

How content from a CMS becomes a rendered page: the content model, an adapter, validation and
rendering. The library contains no CMS-specific code. The field-by-field reference for every block is
[content-model.md](content-model.md) (generated); whole-page templates are in [templates.md](templates.md).

> **Warning: the library does NOT sanitize HTML.** `RichText` (`{ format: 'html', html }`) is inserted
> into the page as-is. Your adapter or host app must sanitize the HTML (allow-list of tags and
> attributes) **before** producing a `RichText` value. The renderer only neutralizes unsafe URLs
> (`javascript:`, `data:` and similar link and image targets); it doesn't strip scripts, event
> handlers, inline styles or iframes.

## The pieces

1. **Content model** (`src/content-types`): plain JSON types. A page is
   `PageContent { id, slug, template?, seo, blocks }`, and each block is one of the block types listed
   in [content-model.md](content-model.md#blocks) (`hero`, `featureGrid`, `faq`, `richText`, `tabs`,
   ...). No functions, React nodes or `Date` objects: dates are ISO 8601 strings.
2. **Adapter** (in the host app): maps the CMS's payload to `PageContent`, including converting rich text
   to sanitized HTML. [`src/adapters/example-cms`](../src/adapters/example-cms/README.md) is a worked
   example for an imaginary CMS, with tests. It isn't exported from the package.
3. **Validation:** `validatePage(page)` returns issues: missing fields, unsafe links, missing alt text,
   duplicate ids, unknown block types and template problems. Run it in CMS preview or CI;
   `errorsOnly(issues)` drops the warnings.
4. **Rendering:** `<BlockRenderer blocks={page.blocks} />` looks up each block in the registry, maps
   content to props (`toProps`), assigns heading levels and wraps each block in a `Section` with the
   right `Container`. `<PageRenderer>` does the same for a whole page, header and footer included
   ([templates.md](templates.md)).

The diagram of this flow is in [ARCHITECTURE.md](ARCHITECTURE.md#content-flow-cms-to-rendered-page).

## Rendering blocks

```tsx check
import { BlockRenderer, errorsOnly, validatePage, type ContactFormValues, type FormStatus, type PageContent } from '@jpiemeisl/pattern-library';

export function Page({ page, status, onContact, isPreview }: { page: PageContent; status: FormStatus; onContact: (values: ContactFormValues) => void; isPreview: boolean }) {
  if (isPreview) console.table(errorsOnly(validatePage(page)));
  return (
    <main id="main">
      <BlockRenderer
        blocks={page.blocks}
        context={{ forms: { contact: { onSubmit: onContact, status } } }}
        onError={(issue) => console.warn(issue.code, issue.message)}
        showErrors={isPreview}
      />
    </main>
  );
}
```

Behavior worth knowing:

- **Headings** are assigned centrally: the first `hero` or `pageHeader` gets the `h1`, every other block
  heading is `h2`, and items inside blocks are `h3`. Authors never choose levels. Pass `h1Provided` when
  the page already has its `h1` (templates that render the title do).
- **Unknown or broken blocks** render nothing and are reported through `onError` (each block also has an
  error boundary). With `showErrors` they render a visible placeholder instead.
- **Links** other than relative, `http(s):`, `mailto:` and `tel:` are refused: the text renders without a
  link and an `unsafe-href` issue is reported. Internal links go through `Link`, so the host app's
  `LinkProvider` applies ([consuming.md](consuming.md#links-wire-linkprovider-to-your-router)).
- **Forms** (`contactForm`, `newsletterSignup`) are interactive only when `context.forms` provides
  handlers; otherwise they render as an inert preview with a note.
- **Layout:** `layout="flow"` stacks blocks without Sections or Containers, for a column inside a
  template (an article body, for example).

## Custom blocks

`createRegistry` adds block types or replaces built-in ones. A custom block declares its own content
type and maps it to any component's props:

```tsx check
import { BlockRenderer, createRegistry, defineBlock, validatePage, type BlockLike, type PageContent } from '@jpiemeisl/pattern-library';

interface QuoteOfTheDayBlock extends BlockLike {
  type: 'quoteOfTheDay';
  quote: string;
  source?: string;
}

function QuoteCard({ text, cite }: { text: string; cite?: string }) {
  return (
    <blockquote>
      <p>{text}</p>
      {cite && <cite>{cite}</cite>}
    </blockquote>
  );
}

const registry = createRegistry([
  defineBlock<QuoteOfTheDayBlock, { text: string; cite?: string }>({
    type: 'quoteOfTheDay',
    label: 'Quote of the day',
    description: 'A short quote with its source.',
    component: QuoteCard,
    toProps: (content, ctx) => {
      if (!content.quote) {
        ctx.report({ code: 'missing-field', message: 'A quote is required.', path: 'quote' });
        return null; // render nothing (or a placeholder with showErrors)
      }
      return { text: content.quote, cite: content.source };
    },
    layout: 'narrow',
  }),
]);

// Validate with the custom types known, so quoteOfTheDay isn't reported as unknown.
export const check = (page: PageContent) => validatePage(page, { knownTypes: registry.types() });

export function Page({ page }: { page: PageContent }) {
  return <BlockRenderer blocks={page.blocks} registry={registry} />;
}
```

A definition with an existing `type` replaces the built-in one; `defaultRegistry` is never mutated.

## Modeling guidance

The modeling rules for CMS content types (one content type per block type, ids, alt text, allowed links,
money in minor units, forms and tabs) are at the top of
[content-model.md](content-model.md#modeling-guidance). Writing an adapter: the
[example adapter's README](../src/adapters/example-cms/README.md) and
[CONTRIBUTING.md](CONTRIBUTING.md#add-a-cms-adapter).
