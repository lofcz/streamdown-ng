---
"@lofcz/streamdown": patch
---

feat: add `streamdown/core` entry whose default rehype plugins omit `rehype-raw`, so `rehype-raw` and `parse5` are not bundled. The default `streamdown` entry is unchanged. Supplied raw HTML parsers work after minification; unparsed HTML is preserved as text without relying on function names.
