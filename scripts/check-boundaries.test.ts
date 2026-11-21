import { describe, expect, it } from 'vitest';
import { checkFile, findSpecifiers, resolveSpecifier } from './check-boundaries.mjs';

const rules = (file: string, source: string) => checkFile(file, source).map((v) => v.rule);

describe('findSpecifiers', () => {
  it('finds imports, type imports, re-exports, side-effect imports, import() and require()', () => {
    const source = [
      "import { a } from './a';",
      "import type { B } from '../b';",
      "import * as c from './c';",
      "import d, { e } from './d';",
      "export { f } from './f';",
      "export * from './g';",
      "import './side-effect.css';",
      "const h = await import('./h');",
      "const i = require('./i');",
      "import {\n  multi,\n  line,\n} from './multi';",
    ].join('\n');
    expect(findSpecifiers(source).map((s) => s.specifier).sort()).toEqual(['../b', './a', './c', './d', './f', './g', './h', './i', './multi', './side-effect.css'].sort());
    expect(findSpecifiers(source).filter((s) => s.reexport).map((s) => s.specifier).sort()).toEqual(['./f', './g']);
  });
});

describe('resolveSpecifier', () => {
  it('resolves relative paths from the importing file and ignores packages', () => {
    expect(resolveSpecifier('src/components/Button/Button.tsx', '../../commerce/logic/money')).toBe('src/commerce/logic/money');
    expect(resolveSpecifier('demo/commerce/provider.tsx', '../../src/commerce')).toBe('src/commerce');
    expect(resolveSpecifier('src/x.ts', 'react')).toBeNull();
  });
});

describe('checkFile', () => {
  it('(a) core library code may not import commerce', () => {
    expect(rules('src/components/Button/Button.tsx', "import { add } from '../../commerce/logic/money';")).toEqual(['a']);
    expect(rules('src/index.ts', "export * from './commerce';")).toEqual(['a']);
    expect(rules('.storybook/preview.tsx', "import { Price } from '../src/commerce';")).toEqual(['a']);
  });

  it('commerce and demo may import commerce; commerce may import core', () => {
    expect(rules('src/commerce/components/Price/Price.tsx', "import { formatMoney } from '../../../utils/formatMoney';\nimport { add } from '../../logic/money';")).toEqual([]);
    expect(rules('demo/commerce/DemoCommerceProvider.tsx', "import { computeCartTotals } from '../../src/commerce';")).toEqual([]);
  });

  it('(b) barrels under src/ may not re-export demo', () => {
    expect(rules('src/commerce/index.ts', "export * from '../../demo/commerce';")).toEqual(['b']);
  });

  it('(c) nothing under src/ may import demo, including commerce and stories', () => {
    expect(rules('src/commerce/components/Price/Price.stories.tsx', "import { withDemoCommerce } from '../../../../demo/commerce';")).toEqual(['c']);
    expect(rules('src/stories/x.tsx', "import type { X } from '../../demo/commerce/types';")).toEqual(['c']);
  });

  it('does not match look-alike paths', () => {
    expect(rules('src/components/x.ts', "import { y } from '../commerce-utils';")).toEqual([]);
    expect(rules('src/components/x.ts', "import { y } from './demo';")).toEqual([]);
    expect(rules('tests/visual/x.spec.ts', "import { y } from '../../demo/commerce';")).toEqual([]);
  });
});
