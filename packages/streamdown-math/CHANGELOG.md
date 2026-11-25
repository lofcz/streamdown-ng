# @streamdown/math

## 1.0.5

### Patch Changes

- f1b28ab: Sync with `vercel/streamdown@4e86b04`:

  - **Streamdown**: support `exactOptionalPropertyTypes` in public types, isolate processor caches by plugin function/callback/RegExp/Map/Set options, refresh custom components on unchanged Markdown, only rewrite `#fragment` links whose target raw-HTML ID was clobbered without quadratic streaming work, neutralize spreadsheet formulas and bound/escape Markdown/image/row-header table exports, pass `cause` to diagram `errorComponent`, add fullscreen copy callbacks, dialog focus management, Escape handling from focused controls, and page wheel scroll when pan/zoom controls are hidden, match code download extensions case-insensitively, count only letters for RTL detection, and linearize custom-tag pairing while leaving inline/self-closing tags unpadded.
  - **remend**: linear-time emphasis, link/image bracket, and bare-URL autolink scanning (with CJK punctuation boundary support), protect single tildes inside URLs and HTML attributes, close links around incomplete images, prevent partial list dashes after containers from turning into setext headings, preserve unfinished link destinations when holding pending inline markers, and support `exactOptionalPropertyTypes`.
  - **CJK**: split `www.` autolinks at CJK punctuation boundaries while preserving bold autolink restoration and explicit link text.
  - **Mermaid / Code / Math**: support `exactOptionalPropertyTypes` in plugin option types, and add `useMermaidDefaults` support in `@lofcz/streamdown-mermaid`.

## 1.0.4

### Patch Changes

- Update KaTeX to 0.18.2 or newer, including its settings prototype-pollution fix. Bundle the rehype adapter while keeping KaTeX external so the published renderer uses the package's declared KaTeX dependency instead of rehype-katex's older private copy.

## 1.0.3

### Patch Changes

- 6e1b81c: Fix KaTeX display math clipping for LLM-style single-line `$$...$$` equations. Sanitize now preserves remark-math's `math-display` / `math-inline` class markers (hast-util-sanitize does not OR multiple className allowlist entries, so a single regex is required). `@lofcz/streamdown-math` promotes lone-paragraph inline math to flow math and bumps `katex` to ^0.18.1 so HTML class names match current KaTeX CSS (`katex-sizing`).

## 1.0.2

### Patch Changes

- 6b42a85: Remove CJS builds

## 1.0.1

### Patch Changes

- 0b80aed: Plugins
