# Example CMS adapter (reference only)

This folder shows how to turn a CMS payload into the library's `PageContent`. It is **not** exported
from `src/index.ts` and is not part of the package API. Copy the patterns into your app's own adapter.

The "CMS" is imaginary. Its payloads ([`fixtures/`](fixtures)) have the shape many headless CMSs use:

- entries with `sys` metadata and nested `fields`
- snake_case field names that differ from the block fields (`sub_headline` becomes `subhead`)
- asset references (`{ asset: { url, title, width, height } }`), with alt text stored in the title
- rich text as a node tree (`paragraph`, `heading_2`, `hyperlink`, `text` with `marks`, ...)
- section types the adapter does not support (`instagram_feed` in `about.json`)

## Files

| File | Purpose |
| --- | --- |
| `types.ts` | The CMS payload types. |
| `richText.ts` | `richTextToHtml`: node tree to sanitized HTML. |
| `mapPage.ts` | `mapPage(payload, { onUnmapped })` plus shared field mappers and one mapper per section type. |
| `example-cms.test.ts` | Converter and mapper tests, and the contract: every payload maps to a page that passes `validatePage` and renders with no issues. |

## Rich text is sanitized here

`RichText` in the content model is `{ format: 'html', html }`, and the renderer trusts that HTML
(apart from stripping unsafe URLs as a second line of defence). The adapter is responsible for safe
output. `richTextToHtml` is hand-written and allow-list based:

- Only paragraphs, `h2`-`h4`, bold, italic, links, ordered/unordered lists, list items and blockquotes
  produce markup. Unknown nodes (embeds, tables) are dropped together with their children.
- All text and attribute values are HTML-escaped.
- Link URLs must pass `isSafeHref` (relative, `http(s):`, `mailto:`, `tel:`). Others keep their text but
  lose the link.

If your CMS can deliver HTML instead of a node tree, run it through a real HTML sanitizer in the
adapter (that would be a dependency of your app, not of this library).

## Mapping guidelines

- **Use the CMS entry id as the block id.** Ids must be unique per page; entry ids are.
- **Map enumerations explicitly** (`display_style: 'full_bleed'` to `variant: 'background'`) rather than
  passing CMS strings through.
- **Leave out missing optional fields** instead of writing `undefined` or empty strings, so the JSON stays
  clean (`compact` in `mapPage.ts`).
- **Do not hide missing required fields.** Map them as empty values and let `validatePage` report them,
  so editors see the problem in preview (`showErrors`) instead of a silently missing section.
- **Report unsupported section types** through `onUnmapped` (log them, or show them in preview).
- **Validate the result**: `validatePage(mapPage(payload))` in CMS preview and in CI.
