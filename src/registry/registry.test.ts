import { describe, expect, it } from 'vitest';
import { blockTypes } from '../content-types/blocks';
import { Text } from '../components/Text';
import { assignHeadingLevels } from './headingLevels';
import { createRegistry, defaultRegistry, missingDefinitions } from './registry';
import { defineBlock, type BlockLike } from './types';
import { validateBlock } from './validate';

const levels = (blocks: BlockLike[]) => assignHeadingLevels(blocks, defaultRegistry.get);

describe('defaultRegistry', () => {
  it('has a definition for every block type in the union', () => {
    expect(missingDefinitions()).toEqual([]);
    expect(defaultRegistry.types().sort()).toEqual([...blockTypes].sort());
  });

  it('gives every definition a label, a description and an example key', () => {
    for (const definition of defaultRegistry.definitions()) {
      expect(definition.label, definition.type).toBeTruthy();
      expect(definition.description, definition.type).toBeTruthy();
      expect(definition.example, definition.type).toBe(definition.type);
    }
  });
});

describe('assignHeadingLevels', () => {
  it('gives the first hero h1 and every other block h2', () => {
    expect(
      levels([
        { id: 'h', type: 'hero', headline: 'x' } as BlockLike,
        { id: 'f', type: 'featureGrid', heading: 'Features' } as BlockLike,
        { id: 'c', type: 'ctaBanner', heading: 'Go' } as BlockLike,
      ]),
    ).toEqual([1, 2, 2]);
  });

  it('allows only one h1 even with two heroes', () => {
    expect(levels([{ id: 'a', type: 'pageHeader' }, { id: 'b', type: 'hero' }])).toEqual([1, 2]);
  });

  it('skips heading-less blocks when looking for the first heading', () => {
    expect(levels([{ id: 's', type: 'spacer' }, { id: 'l', type: 'logoStrip' }, { id: 'p', type: 'pageHeader' }])).toEqual([2, 2, 1]);
  });

  it('gives no h1 when the first heading is not a hero or page header', () => {
    expect(levels([{ id: 'f', type: 'featureGrid', heading: 'Hi' } as BlockLike, { id: 'h', type: 'hero' }])).toEqual([2, 2]);
  });

  it('treats optional headings as absent when empty', () => {
    expect(levels([{ id: 'f', type: 'featureGrid' }, { id: 'h', type: 'hero' }])).toEqual([2, 1]);
  });

  it('ignores unknown block types', () => {
    expect(levels([{ id: 'x', type: 'mystery' }, { id: 'h', type: 'hero' }])).toEqual([2, 1]);
  });
});

interface QuoteBlock extends BlockLike {
  type: 'pullQuote';
  text: string;
}

const pullQuote = defineBlock({
  type: 'pullQuote',
  label: 'Pull quote',
  description: 'A big quote.',
  component: Text,
  hasHeading: () => false,
  toProps: (c: QuoteBlock) => ({ children: c.text, size: 'xl' as const }),
});

describe('createRegistry', () => {
  it('adds custom block types without touching built-ins', () => {
    const registry = createRegistry([pullQuote]);
    expect(registry.get('pullQuote')?.label).toBe('Pull quote');
    expect(registry.get('hero')).toBe(defaultRegistry.get('hero'));
    expect(defaultRegistry.get('pullQuote')).toBeUndefined();
  });

  it('replaces a built-in type with an override of the same type', () => {
    const customHero = defineBlock({
      type: 'hero',
      label: 'Brand hero',
      description: 'Our own hero.',
      component: Text,
      pageHeading: true,
      hasHeading: () => true,
      toProps: (c: BlockLike & { headline: string }) => ({ children: c.headline }),
    });
    const registry = createRegistry([customHero]);
    expect(registry.get('hero')?.label).toBe('Brand hero');
    expect(registry.types()).toHaveLength(blockTypes.length);
  });

  it('makes custom types known to validation', () => {
    const registry = createRegistry([pullQuote]);
    expect(validateBlock({ id: 'q', type: 'pullQuote', text: 'Hi' }, { knownTypes: registry.types() })).toEqual([]);
    expect(validateBlock({ id: 'q', type: 'pullQuote', text: 'Hi' })[0]?.code).toBe('unknown-type');
  });

  it('defineBlock defaults: contained layout, md padding, heading from content.heading', () => {
    const plain = defineBlock({ type: 'plain', label: 'Plain', description: 'x', component: Text, toProps: () => ({ children: 'x' }) });
    expect(plain.layout({ id: 'p', type: 'plain' })).toBe('contained');
    expect(plain.defaultPadding({ id: 'p', type: 'plain' })).toBe('md');
    expect(plain.hasHeading({ id: 'p', type: 'plain', heading: 'Yes' } as BlockLike)).toBe(true);
    expect(plain.hasHeading({ id: 'p', type: 'plain' })).toBe(false);
  });
});
