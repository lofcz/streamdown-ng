---
"@lofcz/streamdown": patch
---

Add `@lofcz/streamdown/core`, whose default rehype plugins omit `rehype-raw`, so `rehype-raw` and `parse5` are not bundled. The main entry still parses HTML by default. Supplied raw HTML parsers work after minification; unparsed HTML is preserved as text without relying on function names, or omitted with `skipHtml`.

The core and animation entry declarations support NodeNext and bundler module resolution.
