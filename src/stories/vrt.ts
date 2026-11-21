/**
 * Story parameters for the visual regression harness.
 *
 * `vrtEdges`: full-page screenshots at mobile and desktop only, skipping 768. For low-risk
 * variants of `vrt-full` components (state or colour variants whose layout is already covered
 * at 768 by a sibling story). Usage: `parameters: { ...vrtEdges }`.
 *
 * Parameters are read at runtime, so spreading this object is fine. Tags are not: Storybook reads
 * `tags` statically, so they must be written literally on each meta or story, never spread in.
 * Frozen so no story can mutate the shared object.
 */
export const vrtEdges = Object.freeze({
  vrt: Object.freeze({
    viewports: Object.freeze([Object.freeze({ width: 375, fullPage: true }), Object.freeze({ width: 1280, fullPage: true })]),
  }),
});
