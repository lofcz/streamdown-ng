import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Options } from "tsup";

type EsbuildPlugin = NonNullable<Options["esbuildPlugins"]>[number];
const DEFAULT_RAW_FILTER = /default-raw$/;
const defaultRawPath = fileURLToPath(
  new URL("lib/default-raw.ts", import.meta.url)
);
const coreRawPath = fileURLToPath(
  new URL("lib/default-raw.core.ts", import.meta.url)
);
const omitDefaultRaw: EsbuildPlugin = {
  name: "streamdown-core-no-raw",
  setup(build) {
    build.onResolve({ filter: DEFAULT_RAW_FILTER }, (args) =>
      `${resolve(args.resolveDir, args.path)}.ts` === defaultRawPath
        ? { path: coreRawPath }
        : undefined
    );
  },
};
const ANIMATE_ENTRY_IMPORT = /^\.\.\/animate$/;
const loadAnimateAtRuntime: EsbuildPlugin = {
  name: "streamdown-lazy-animation",
  setup(build) {
    build.onResolve({ filter: ANIMATE_ENTRY_IMPORT }, () => ({
      external: true,
      path: "./animate.js",
    }));
  },
};
const shared = {
  format: ["esm"],
  minify: true,
  outDir: "dist",
  sourcemap: false,
  external: ["react", "react-dom", "three", /^three\//],
  treeshake: true,
  splitting: true,
  platform: "browser",
} satisfies Options;
export default defineConfig([
  {
    ...shared,
    entry: ["index.tsx", "lib/tailwind-classes.ts"],
    esbuildPlugins: [loadAnimateAtRuntime],
  },
  {
    ...shared,
    entry: { core: "core.ts" },
    esbuildPlugins: [omitDefaultRaw, loadAnimateAtRuntime],
  },
  { ...shared, entry: ["animate.ts"], splitting: false },
]);
