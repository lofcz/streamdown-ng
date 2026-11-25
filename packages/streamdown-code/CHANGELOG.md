# @streamdown/code

## 2.0.3

### Patch Changes

- f1b28ab: Sync with `vercel/streamdown@4e86b04`:

  - **Streamdown**: support `exactOptionalPropertyTypes` in public types, isolate processor caches by plugin function/callback/RegExp/Map/Set options, refresh custom components on unchanged Markdown, only rewrite `#fragment` links whose target raw-HTML ID was clobbered without quadratic streaming work, neutralize spreadsheet formulas and bound/escape Markdown/image/row-header table exports, pass `cause` to diagram `errorComponent`, add fullscreen copy callbacks, dialog focus management, Escape handling from focused controls, and page wheel scroll when pan/zoom controls are hidden, match code download extensions case-insensitively, count only letters for RTL detection, and linearize custom-tag pairing while leaving inline/self-closing tags unpadded.
  - **remend**: linear-time emphasis, link/image bracket, and bare-URL autolink scanning (with CJK punctuation boundary support), protect single tildes inside URLs and HTML attributes, close links around incomplete images, prevent partial list dashes after containers from turning into setext headings, preserve unfinished link destinations when holding pending inline markers, and support `exactOptionalPropertyTypes`.
  - **CJK**: split `www.` autolinks at CJK punctuation boundaries while preserving bold autolink restoration and explicit link text.
  - **Mermaid / Code / Math**: support `exactOptionalPropertyTypes` in plugin option types, and add `useMermaidDefaults` support in `@lofcz/streamdown-mermaid`.

## 2.0.2

### Patch Changes

- b143570: Bound the finished highlight-result cache by retained tokens, lines, and source
  size, evict least-recently-used results, and avoid retaining intermediate
  streaming results. Preserve custom-theme object identity and full-source cache
  keys so similarly named themes and edited code cannot share incorrect tokens.

## 2.0.1

### Patch Changes

- ed6d761: Sync upstream and port PRs #630, #631, #632, #633, and #635 with regression fixes. Export typed default components; retain explicit links when disabling autolinks; validate CJK URL splits. Buffer pending inline markers only while streaming, preserve empty lists, and protect comparisons, generics, and escaped HTML syntax. Incrementally highlight completed code lines with exact, bounded result caching. Coalesce diagram rendering while respecting plugin/configuration changes and unmounts. Reduce animation style parsing, caret invalidation, and scroll layout reads without losing fork effects or asynchronous scroll viewports.

## 2.0.0

### Major Changes

- 59a8682: Upgrade Shiki to v4. Node.js 20 or newer is now required when using `@lofcz/streamdown-code`.

## 1.1.1

### Patch Changes

- 651873d: Fall back to plain text highlighting when the code block language identifier is unknown or truncated mid-stream, preventing Shiki from throwing on unsupported language names.

## 1.1.0

### Minor Changes

- 01d27e9: Add support for custom Shiki themes via a `themes` option on `createCodePlugin`, accepting a `[light, dark]` pair of bundled theme names or full theme registration objects.

## 1.0.3

### Patch Changes

- c597336: Use JS engine

## 1.0.2

### Patch Changes

- c995fb7: Add bundled-language aliases for common JavaScript, TypeScript, and shell code fence labels.
- 6b42a85: Remove CJS builds

## 1.0.1

### Patch Changes

- 0b80aed: Plugins
