---
"@lofcz/streamdown-code": patch
---

Bound the finished highlight-result cache by retained tokens, lines, and source
size, evict least-recently-used results, and avoid retaining intermediate
streaming results. Preserve custom-theme object identity and full-source cache
keys so similarly named themes and edited code cannot share incorrect tokens.
