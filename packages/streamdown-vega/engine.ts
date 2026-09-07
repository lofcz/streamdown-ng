import { createVegaEngine } from "./index";

/**
 * Bundler-graph engine loader for `vega` / `vega-lite`.
 *
 * This is a separate entry point on purpose: importing it is what pulls those
 * packages into your bundler's module graph. Apps that never import this entry
 * keep both runtimes completely out of their build.
 *
 * Requires `vega` and `vega-lite` to be installed (optional peer dependencies).
 */
export const engine = createVegaEngine(
  /* webpackChunkName: "vega-runtime" */
  () => import("vega"),
  /* webpackChunkName: "vega-lite-compiler" */
  () => import("vega-lite")
);
