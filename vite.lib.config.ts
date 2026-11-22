import { resolve } from 'node:path';
import { defineConfig, normalizePath, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/*
 * Library build (npm run build:lib), verification only: the package stays private and unpublished.
 * Two passes into dist/: `vite build -c vite.lib.config.ts` (core) and `--mode commerce`. Each is an ES
 * module with its CSS beside it. react, react-dom and react/jsx-runtime are peer externals. In the
 * commerce pass every import of core code becomes an import of the package's core entry, so commerce
 * never carries a second copy of core. CSS modules are always bundled where they are used.
 */
const PACKAGE = 'storybook-playwright';
const root = normalizePath(import.meta.dirname) + '/';
const src = root + 'src/';
const commerceDir = root + 'src/commerce/';

/** In the commerce pass: core source files resolve to the external package entry. */
function coreAsExternal(): Plugin {
  return {
    name: 'core-as-external',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || !normalizePath(importer).startsWith(commerceDir) || source.endsWith('.css')) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (!resolved || resolved.external) return resolved;
      const file = normalizePath(resolved.id.split('?')[0]!);
      if (file.startsWith(src) && !file.startsWith(commerceDir)) return { id: PACKAGE, external: true };
      return resolved;
    },
  };
}

/** Writes dist/<entry>.modules.json: the source files in the bundle, for npm run check:lib. */
function moduleList(name: string): Plugin {
  return {
    name: 'module-list',
    generateBundle(_options, bundle) {
      const ids = Object.values(bundle).flatMap((chunk) => (chunk.type === 'chunk' ? chunk.moduleIds : []));
      const files = ids.filter((id) => !id.startsWith('\0')).map((id) => normalizePath(id.split('?')[0]!).replace(root, ''));
      this.emitFile({ type: 'asset', fileName: `${name}.modules.json`, source: JSON.stringify([...new Set(files)].sort(), null, 2) });
    },
  };
}

export default defineConfig(({ mode }) => {
  const commerce = mode === 'commerce';
  return {
    plugins: [react(), ...(commerce ? [coreAsExternal()] : []), moduleList(commerce ? 'commerce' : 'core')],
    publicDir: false,
    build: {
      outDir: 'dist',
      emptyOutDir: !commerce,
      sourcemap: false,
      minify: false,
      cssCodeSplit: false,
      lib: {
        entry: commerce ? resolve(import.meta.dirname, 'src/commerce/index.ts') : resolve(import.meta.dirname, 'src/index.ts'),
        formats: ['es'],
        fileName: () => (commerce ? 'commerce.js' : 'core.js'),
        cssFileName: commerce ? 'commerce' : 'core',
      },
      rollupOptions: {
        external: [/^react($|\/)/, /^react-dom($|\/)/, ...(commerce ? [PACKAGE] : [])],
      },
    },
  };
});
