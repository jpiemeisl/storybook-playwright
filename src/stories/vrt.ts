/**
 * Story parameters for the visual regression harness.
 *
 * `vrtEdges`: full-page screenshots at mobile and desktop only, skipping 768. For low-risk
 * variants of `vrt-full` components (state or colour variants whose layout is already covered
 * at 768 by a sibling story). Usage: `parameters: { ...vrtEdges }`.
 */
export const vrtEdges = {
  vrt: {
    viewports: [
      { width: 375, fullPage: true },
      { width: 1280, fullPage: true },
    ],
  },
};
