# @streamdown/mermaid

## 1.0.3

### Patch Changes

- f1b28ab: Sync with `vercel/streamdown@4e86b04`:

  - **Streamdown**: support `exactOptionalPropertyTypes` in public types, isolate processor caches by plugin function/callback/RegExp/Map/Set options, refresh custom components on unchanged Markdown, only rewrite `#fragment` links whose target raw-HTML ID was clobbered without quadratic streaming work, neutralize spreadsheet formulas and bound/escape Markdown/image/row-header table exports, pass `cause` to diagram `errorComponent`, add fullscreen copy callbacks, dialog focus management, Escape handling from focused controls, and page wheel scroll when pan/zoom controls are hidden, match code download extensions case-insensitively, count only letters for RTL detection, and linearize custom-tag pairing while leaving inline/self-closing tags unpadded.
  - **remend**: linear-time emphasis, link/image bracket, and bare-URL autolink scanning (with CJK punctuation boundary support), protect single tildes inside URLs and HTML attributes, close links around incomplete images, prevent partial list dashes after containers from turning into setext headings, preserve unfinished link destinations when holding pending inline markers, and support `exactOptionalPropertyTypes`.
  - **CJK**: split `www.` autolinks at CJK punctuation boundaries while preserving bold autolink restoration and explicit link text.
  - **Mermaid / Code / Math**: support `exactOptionalPropertyTypes` in plugin option types, and add `useMermaidDefaults` support in `@lofcz/streamdown-mermaid`.

## 1.0.2

### Patch Changes

- ac25c6b: Fix incorrect zoom-out icon SVG in Mermaid preview plugin.
- 6b42a85: Remove CJS builds
- a1e2fad: Patch upstream security vulnerability

## 1.0.1

### Patch Changes

- 0b80aed: Plugins
