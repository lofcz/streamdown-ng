# @lofcz/streamdown-ascii

## 1.1.0

### Minor Changes

- 85f360f: Add `@lofcz/streamdown-ascii`, a plugin that renders agent-generated ASCII and Unicode box-drawing diagrams as stable preformatted blocks. It binds to `ascii, `diagram, and ```chart fences by default, disables ligatures so sequences like `-->` stay aligned, and renders a single text node so streaming appends never reflow existing rows.
