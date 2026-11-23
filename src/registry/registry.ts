import { blockTypes, type BlockType } from '../content-types/blocks';
import { faq, divider, gallery, mapEmbed, richText, spacer, steps, table, tabs, team, timeline, videoEmbed } from './definitions/content';
import { contactForm, newsletterSignup } from './definitions/interactive';
import {
  articleCardGrid,
  cardGrid,
  ctaBanner,
  featureGrid,
  hero,
  logoStrip,
  mediaText,
  pageHeader,
  pricingTable,
  stats,
  testimonial,
  testimonialGrid,
} from './definitions/sections';
import type { RegisteredBlock } from './types';

/** A lookup of block definitions by `type`, as created by createRegistry() and passed to BlockRenderer. */
export interface Registry {
  get: (type: string) => RegisteredBlock | undefined;
  /** Every registered type, built-in and custom. */
  types: () => string[];
  definitions: () => RegisteredBlock[];
}

/** One definition per built-in block type (checked against the Block union at compile time). */
const builtIn = {
  hero,
  pageHeader,
  featureGrid,
  cardGrid,
  articleCardGrid,
  mediaText,
  ctaBanner,
  stats,
  testimonial,
  testimonialGrid,
  logoStrip,
  faq,
  pricingTable,
  richText,
  gallery,
  videoEmbed,
  mapEmbed,
  team,
  timeline,
  steps,
  tabs,
  table,
  contactForm,
  newsletterSignup,
  divider,
  spacer,
} satisfies Record<BlockType, RegisteredBlock>;

/**
 * Creates a registry: the built-in definitions plus `overrides`, which replace a built-in type
 * (same `type`) or add a new one. Build overrides with defineBlock() so they are fully typed.
 */
export function createRegistry(overrides: RegisteredBlock[] = []): Registry {
  const map = new Map<string, RegisteredBlock>(Object.values(builtIn).map((definition) => [definition.type, definition]));
  for (const definition of overrides) map.set(definition.type, definition);
  return {
    get: (type) => map.get(type),
    types: () => [...map.keys()],
    definitions: () => [...map.values()],
  };
}

/** The registry with only the built-in block definitions; BlockRenderer uses it when no `registry` is passed. */
export const defaultRegistry: Registry = createRegistry();

/** Runtime check (also run by unit tests): every built-in block type has a definition. */
export function missingDefinitions(registry: Registry = defaultRegistry): string[] {
  return blockTypes.filter((type) => !registry.get(type));
}
