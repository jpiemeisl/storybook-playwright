import type { BlockLike, RegisteredBlock } from './types';

/**
 * Assigns each top-level block its heading level, centrally, so a page cannot end up with two h1s or
 * skipped levels whatever order authors choose:
 *
 * - Find the first block that renders a heading. If it is a hero or pageHeader, it gets h1.
 * - Every other block gets h2 for its own heading; its items get h3 (itemHeadingLevel = level + 1).
 * - Nested blocks (inside tabs) get h3 / h4.
 * - With `h1Provided` (a template already rendered the page title as h1), no block gets h1.
 *
 * Pure: takes blocks and a lookup, returns one level per block (by index).
 */
export function assignHeadingLevels(
  blocks: readonly BlockLike[],
  lookup: (type: string) => RegisteredBlock | undefined,
  options: { h1Provided?: boolean } = {},
): (1 | 2)[] {
  if (options.h1Provided) return blocks.map(() => 2);
  const firstHeading = blocks.findIndex((block) => {
    const definition = lookup(block.type);
    return definition ? safely(() => definition.hasHeading(block)) : false;
  });
  const h1Index = firstHeading >= 0 && lookup(blocks[firstHeading]!.type)?.pageHeading ? firstHeading : -1;
  return blocks.map((_, index) => (index === h1Index ? 1 : 2));
}

/** hasHeading runs on unvalidated content; treat a throw as "no heading". */
function safely(fn: () => boolean): boolean {
  try {
    return fn();
  } catch {
    return false;
  }
}
