---
"@lofcz/streamdown": patch
---

Expose completed diagram failures to custom error components even after a successful preview, and keep diagnostics associated with the source that failed. TikZ repair handlers receive the original source and compiler error without reacting to incomplete fences or stale render failures.
