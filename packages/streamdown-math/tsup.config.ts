import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  minify: true,
  outDir: "dist",
  sourcemap: false,
  treeshake: true,
  platform: "browser",
  // Bind the adapter's KaTeX import to this package's patched runtime. Its
  // own dependency is capped at 0.16.x. Keep the shared utilities external
  // so consumer bundlers can deduplicate them with the Markdown pipeline.
  noExternal: ["rehype-katex"],
  external: [
    "react",
    "react-dom",
    "katex",
    "hast-util-from-html-isomorphic",
    "hast-util-to-text",
    "unist-util-visit-parents",
  ],
});
