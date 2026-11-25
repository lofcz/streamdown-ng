# @streamdown/cjk

## 1.0.7

### Patch Changes

- f1b28ab: Sync with `vercel/streamdown@4e86b04`:

  - **Streamdown**: support `exactOptionalPropertyTypes` in public types, isolate processor caches by plugin function/callback/RegExp/Map/Set options, refresh custom components on unchanged Markdown, only rewrite `#fragment` links whose target raw-HTML ID was clobbered without quadratic streaming work, neutralize spreadsheet formulas and bound/escape Markdown/image/row-header table exports, pass `cause` to diagram `errorComponent`, add fullscreen copy callbacks, dialog focus management, Escape handling from focused controls, and page wheel scroll when pan/zoom controls are hidden, match code download extensions case-insensitively, count only letters for RTL detection, and linearize custom-tag pairing while leaving inline/self-closing tags unpadded.
  - **remend**: linear-time emphasis, link/image bracket, and bare-URL autolink scanning (with CJK punctuation boundary support), protect single tildes inside URLs and HTML attributes, close links around incomplete images, prevent partial list dashes after containers from turning into setext headings, preserve unfinished link destinations when holding pending inline markers, and support `exactOptionalPropertyTypes`.
  - **CJK**: split `www.` autolinks at CJK punctuation boundaries while preserving bold autolink restoration and explicit link text.
  - **Mermaid / Code / Math**: support `exactOptionalPropertyTypes` in plugin option types, and add `useMermaidDefaults` support in `@lofcz/streamdown-mermaid`.

## 1.0.6

### Patch Changes

- 354b506: Preserve strong formatting around autolinks followed by CJK punctuation.

## 1.0.5

### Patch Changes

- ed6d761: Sync upstream and port PRs #630, #631, #632, #633, and #635 with regression fixes. Export typed default components; retain explicit links when disabling autolinks; validate CJK URL splits. Buffer pending inline markers only while streaming, preserve empty lists, and protect comparisons, generics, and escaped HTML syntax. Incrementally highlight completed code lines with exact, bounded result caching. Coalesce diagram rendering while respecting plugin/configuration changes and unmounts. Reduce animation style parsing, caret invalidation, and scroll layout reads without losing fork effects or asynchronous scroll viewports.

## 1.0.4

### Patch Changes

- 4d1d442: Re-linkify bare URLs that follow CJK punctuation when splitting GFM autolink literals (e.g. URLs separated by fullwidth semicolons).

## 1.0.3

### Patch Changes

- 6f1ea07: Updated `remark-cjk-friendly` and `remark-cjk-friendly-gfm-strikethrough` from v1.x to v2.x. The only breaking change in v2.0.0 is dropping Node.js 16 support, which Streamdown has already dropped (requires Node.js ≥18), so there is no actual impact. The actual code is identical to the latest v1.x release (v2.0.1 only added the ability to import package.json).

## 1.0.2

### Patch Changes

- 6b42a85: Remove CJS builds

## 1.0.1

### Patch Changes

- 0b80aed: Plugins
