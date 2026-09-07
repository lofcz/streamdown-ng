import { createSmilesEngine } from "./index";

/**
 * Bundler-graph engine loader for `smiles-drawer`.
 *
 * This is a separate entry point on purpose: importing it is what pulls that
 * package into your bundler's module graph. Apps that never import this entry
 * keep the renderer completely out of their build.
 *
 * Requires `smiles-drawer` to be installed (optional peer dependency).
 */
export const engine = createSmilesEngine(
  /* webpackChunkName: "smiles-drawer-engine" */
  () => import("smiles-drawer")
);
