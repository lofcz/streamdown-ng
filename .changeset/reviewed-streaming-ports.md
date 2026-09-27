---
"@lofcz/streamdown": minor
"@lofcz/streamdown-code": patch
"@lofcz/streamdown-cjk": patch
"@lofcz/remend": patch
---

Sync upstream and port PRs #630, #631, #632, #633, and #635 with regression fixes. Export typed default components; retain explicit links when disabling autolinks; validate CJK URL splits. Buffer pending inline markers only while streaming, preserve empty lists, and protect comparisons, generics, and escaped HTML syntax. Incrementally highlight completed code lines with exact, bounded result caching. Coalesce diagram rendering while respecting plugin/configuration changes and unmounts. Reduce animation style parsing, caret invalidation, and scroll layout reads without losing fork effects or asynchronous scroll viewports.
