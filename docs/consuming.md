# Using @jpiemeisl/pattern-library

How a project installs and uses the pattern library. The package is **private**, published to GitHub
Packages (not npmjs.org), so installing it needs a token with read access. This file ships inside the
package; the full documentation is in the repository:
[github.com/jpiemeisl/storybook-playwright](https://github.com/jpiemeisl/storybook-playwright).

Requirements: React 19 and React DOM 19 (peer dependencies; the components use React 19's `ref` as a prop),
and a bundler that understands package `exports` and CSS imports (Vite, Next.js, webpack 5, Parcel...).
The package is ES modules only.

## Access

### On your machine: a personal access token (classic)

1. GitHub → your avatar → **Settings** → **Developer settings** → **Personal access tokens** →
   **Tokens (classic)** → **Generate new token (classic)**.
2. Give it a name and an expiry, tick only **`read:packages`**, and generate it. You also need read access
   to the package itself: ask a maintainer if the install returns 403.
3. Store it outside every repository, as an environment variable in your shell profile or a secrets
   manager:

   ```sh
   # macOS/Linux (~/.zshrc, ~/.bashrc)
   export NODE_AUTH_TOKEN=ghp_your_token
   ```

   ```powershell
   # Windows: a user environment variable (new terminals pick it up)
   [Environment]::SetEnvironmentVariable('NODE_AUTH_TOKEN', 'ghp_your_token', 'User')
   ```

**Fine-grained tokens don't work here.** As of November 2026, GitHub's documentation for the npm registry
says GitHub Packages supports authentication only with a personal access token (classic). Use a classic
token with just `read:packages` and a short expiry.

### In a consuming repository's GitHub Actions

Use the workflow's own `GITHUB_TOKEN`; no personal token is needed. The repository has to be granted
access once, by a package admin:

1. On GitHub, open the package: the owner's profile → **Packages** → **pattern-library**.
2. Click **Package settings** (right-hand side).
3. Under **Manage Actions access**, click **Add repository**, find your repository and select it.
4. Set its **Role** to **Read**.

Then in the workflow:

```yaml
permissions:
  contents: read
  packages: read        # install @jpiemeisl/pattern-library

steps:
  - uses: actions/checkout@<sha> # pin by full SHA
  - uses: actions/setup-node@<sha> # pin by full SHA
    with:
      node-version-file: .nvmrc
      registry-url: https://npm.pkg.github.com
      scope: '@jpiemeisl'
  - run: npm ci
    env:
      NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## .npmrc

Commit this `.npmrc` next to your package.json. It contains no secret: npm reads the token from the
`NODE_AUTH_TOKEN` environment variable when it runs. Only the `@jpiemeisl` scope goes to GitHub Packages;
everything else still comes from npmjs.org.

```ini
@jpiemeisl:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Never write the token itself into `.npmrc` or any committed file. npm stops with an error if
`NODE_AUTH_TOKEN` isn't set; that's the reminder to set it.

## Install

```sh
npm install @jpiemeisl/pattern-library react@19 react-dom@19
```

Before 1.0.0, a minor version (0.2.0) may contain breaking changes, so take patches only. npm's default
`^` range already does that for 0.x versions (`^0.2.0` allows 0.2.x, not 0.3.0); `~0.2.0` says the same
thing explicitly. Read the CHANGELOG (shipped as `CHANGELOG.md` in the package) before taking a minor
version. What counts as public
API is in [versioning.md](https://github.com/jpiemeisl/storybook-playwright/blob/main/docs/versioning.md),
and every exported name is listed in
[api-surface.md](https://github.com/jpiemeisl/storybook-playwright/blob/main/docs/api-surface.md).

## Entry points

| Import | What it is |
| --- | --- |
| `@jpiemeisl/pattern-library` | Core: components, layout, site chrome, content model, `BlockRenderer`, `PageRenderer`, templates, validation, `LinkProvider`, `Theme`, types |
| `@jpiemeisl/pattern-library/commerce` | Commerce: templates, components, hooks and pure logic for listing, product, cart, checkout and account. Optional; it imports core, never the reverse |
| `@jpiemeisl/pattern-library/tokens.css` | Layer order, reset, primitive and semantic tokens, every theme, base styles |
| `@jpiemeisl/pattern-library/themes/<name>.css` | One theme (`harbor`, `orchard`), for builds that load themes separately |
| `@jpiemeisl/pattern-library/tokens/*` | The individual token files (`tokens/index.css` is the same as `tokens.css`) |
| `@jpiemeisl/pattern-library/core.css` | Styles of the core components |
| `@jpiemeisl/pattern-library/commerce.css` | Styles of the commerce components |

Types come with every JavaScript entry point (`types` condition); nothing extra to install.

```tsx check
import { Button, Container, Heading, PageRenderer, createTemplates, validatePage, type PageContent } from '@jpiemeisl/pattern-library';
import { commerceTemplates, computeCartTotals, type CommerceContext } from '@jpiemeisl/pattern-library/commerce';
```

## CSS

Import the CSS once, at the root of the app, in this order:

```tsx check
import '@jpiemeisl/pattern-library/tokens.css';    // layers, reset, tokens, all themes, base
import '@jpiemeisl/pattern-library/core.css';      // core components
import '@jpiemeisl/pattern-library/commerce.css';  // only if you use the commerce entry point
```

`tokens.css` already includes every theme. To load only some, replace `tokens.css` with your own CSS file
that imports the pieces. The pieces contain no `@layer` of their own (`tokens.css` puts each one in its
layer), so declare the layer order and import each piece into its layer, as `tokens.css` does:

```css
/* app.css: tokens.css with only the harbor theme */
@layer reset, tokens, base, components, overrides;
@import '@jpiemeisl/pattern-library/tokens/reset.css' layer(reset);
@import '@jpiemeisl/pattern-library/tokens/primitives.css' layer(tokens);
@import '@jpiemeisl/pattern-library/tokens/semantic.css' layer(tokens);
@import '@jpiemeisl/pattern-library/themes/harbor.css' layer(tokens);
@import '@jpiemeisl/pattern-library/tokens/base.css' layer(base);
```

`semantic.css` is the `default` theme, so it is always needed. Imported without a layer, `reset.css`
would override the component styles.

The library's CSS lives in cascade layers (`reset, tokens, base, components, overrides`). Put your own
overrides in the `overrides` layer or in unlayered CSS, and they win without specificity fights. Style
with the semantic tokens (`--color-action`, `--color-bg`...), never the generated class names.

## Links: wire LinkProvider to your router

Every internal link in the library (components, blocks, templates) renders through `Link`, which uses the
component you give `LinkProvider`. External links always render a plain `<a>`.

**Next.js (App Router).** The bundles don't include a `'use client'` directive, so render library
components from Client Components. A providers file is the usual place:

```tsx check
// app/providers.tsx
'use client';
import NextLink from 'next/link';
import type { ReactNode } from 'react';
import { LinkProvider } from '@jpiemeisl/pattern-library';

export function Providers({ children }: { children: ReactNode }) {
  return <LinkProvider component={NextLink}>{children}</LinkProvider>;
}
```

```tsx
// app/layout.tsx
import type { ReactNode } from 'react';
import '@jpiemeisl/pattern-library/tokens.css';
import '@jpiemeisl/pattern-library/core.css';
import { Providers } from './providers';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="default">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**React Router.** Its `Link` takes `to`, so adapt it once:

```tsx check
import { Link as RouterLink, Routes } from 'react-router';
import { LinkProvider, type LinkComponentProps } from '@jpiemeisl/pattern-library';

function AppLink({ href, ...rest }: LinkComponentProps) {
  return <RouterLink to={href} {...rest} />;
}

export function App() {
  return (
    <LinkProvider component={AppLink}>
      <Routes>{/* your routes */}</Routes>
    </LinkProvider>
  );
}
```

## Themes

The themes are `default`, `harbor` (dark) and `orchard`. A theme applies to an element and everything
inside it, and themes nest.

```tsx check
import type { ReactNode } from 'react';
import { Theme, themes, type ThemeName } from '@jpiemeisl/pattern-library';

export function Document({ theme, children }: { theme: ThemeName; children: ReactNode }) {
  return (
    <html data-theme={theme}>{/* the whole page */}
      <body>
        {children}
        {/* One region: Theme renders a single element with data-theme. */}
        <Theme name="orchard" as="section">Seasonal offers</Theme>
      </body>
    </html>
  );
}

// ['default', 'harbor', 'orchard'], for a theme picker.
export const themeNames = themes.map((t) => t.name);
```

`Theme` has no effects and no storage, and it's safe to render on the server. Choosing and remembering the
theme (a cookie, user preference, `prefers-color-scheme`) is the host app's job.

## Pages: PageRenderer and templates

Pages are data (`PageContent` and template page shapes, usually produced by a CMS adapter). `PageRenderer`
picks the template from `page.template` and renders the whole page, header and footer included.

```tsx check
import { PageRenderer, createTemplates, getDocumentMeta, validatePage, type PageContent, type SiteChrome } from '@jpiemeisl/pattern-library';
import { commerceTemplates } from '@jpiemeisl/pattern-library/commerce';

// The core templates plus the commerce ones (collection, product detail, cart, checkout, account...).
// createTemplates returns a new record; build it once, outside components.
export const templates = createTemplates(Object.values(commerceTemplates));

export function Page({ page, chrome, path }: { page: PageContent; chrome: SiteChrome; path: string }) {
  return <PageRenderer page={page} chrome={chrome} templates={templates} ctx={{ currentPath: path, onError: console.warn }} />;
}

// <head> is yours: the title, description, canonical URL, robots and Open Graph data.
export const meta = (page: PageContent) => getDocumentMeta(page);

// In your CMS preview or tests: an empty list means the page is valid.
export const issues = (page: unknown) => validatePage(page, { knownTemplates: Object.keys(templates) });
```

Unknown templates and pages missing their template's data fall back to the default template, and are
reported through `ctx.onError`. The template guide (adding and replacing templates):
[templates.md](https://github.com/jpiemeisl/storybook-playwright/blob/main/docs/templates.md).

## Commerce

The commerce entry point is optional and separate: core never imports it, so a content-only site doesn't
ship it. The templates are presentational. Your app owns the cart, checkout and account state, and
connects them through `ctx` (a `CommerceContext`):

```tsx check
import type { ReactNode } from 'react';
import { PageRenderer, createTemplates, type PageContent, type SiteChrome } from '@jpiemeisl/pattern-library';
import { commerceTemplates, type CommerceContext } from '@jpiemeisl/pattern-library/commerce';

// Stand-ins for your own cart store and your payment provider's hosted fields.
declare const cart: { add(item: unknown): Promise<void>; update(lineId: string, quantity: number): void };
declare const hostedPaymentFields: ReactNode;

const templates = createTemplates(Object.values(commerceTemplates));

export function CommercePage({ page, chrome, currentPath }: { page: PageContent; chrome: SiteChrome; currentPath: string }) {
  const ctx: CommerceContext = {
    currentPath,
    productHref: (product) => `/products/${product.handle}`,
    onAddToCart: async (item) => cart.add(item), // return a promise for the button's loading/success/error states
    onQuantityChange: (lineId, quantity) => cart.update(lineId, quantity),
    paymentFields: hostedPaymentFields, // your payment provider's hosted fields: see below
  };
  return <PageRenderer page={page} chrome={chrome} templates={templates} ctx={ctx} />;
}
```

Pure helpers for your server or state code are exported too, for example `computeCartTotals`,
`buildCollectionListing`, `parseFilters`, `getCheckoutSteps` and `validateCheckoutStep`. Guides:
[browsing](https://github.com/jpiemeisl/storybook-playwright/blob/main/docs/commerce-browsing.md),
[checkout](https://github.com/jpiemeisl/storybook-playwright/blob/main/docs/commerce-checkout.md),
[accounts](https://github.com/jpiemeisl/storybook-playwright/blob/main/docs/commerce-account.md).

## Security reminders

- **The library does not sanitize HTML.** Rich text (`{ format: 'html', html }`) and `Prose sanitizedHtml`
  are inserted as-is. Your CMS adapter (or backend) **must** sanitize them with an allow-list of tags and
  attributes before they reach the library. The renderer only neutralizes unsafe link and image URLs
  (`javascript:`, `data:`...); it doesn't remove scripts, event handlers, styles or iframes.
- **Payment fields go only in the slot.** The library never renders card number, expiry or CVC inputs.
  Put your payment provider's hosted fields (iframes) in `ctx.paymentFields` (checkout) or the
  `paymentFields` slot (account past-due notice), so card data never passes through your React code.
- **No storage, cookies or network.** The library never reads or writes `localStorage`, cookies or the
  network; consent, sessions and data fetching stay in your app.

## Dependabot in a consuming repository

Dependabot can update this package like any other. Two pieces are needed:

1. **Access.** Grant the consuming repository **Read** access in the package's **Manage Actions access**
   (the steps under "In a consuming repository's GitHub Actions" above). Dependabot then authenticates to
   GitHub Packages with its own `GITHUB_TOKEN`; no personal token is needed.
2. **Configuration.** The committed `.npmrc` (above) maps the scope. Then in `.github/dependabot.yml`:

   ```yaml
   version: 2
   registries:
     github-packages:
       type: npm-registry
       url: https://npm.pkg.github.com
       token: ${{ secrets.GITHUB_TOKEN }}
   updates:
     - package-ecosystem: npm
       directory: /
       schedule:
         interval: weekly
       registries:
         - github-packages
   ```

   If GitHub doesn't let Dependabot use the automatic token for your setup, store a classic token with
   `read:packages` as a **Dependabot** secret (repository **Settings** → **Secrets and variables** →
   **Dependabot** → **New repository secret**, for example `PACKAGES_READ_TOKEN`) and use
   `token: ${{ secrets.PACKAGES_READ_TOKEN }}` instead.

Before 1.0.0, review minor updates by hand: they may contain breaking changes (the pull request includes
the CHANGELOG entry).
