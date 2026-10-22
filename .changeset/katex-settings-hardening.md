---
"@lofcz/streamdown-math": patch
---

Update KaTeX to 0.18.2 or newer, including its settings prototype-pollution fix. Bundle the rehype adapter while keeping KaTeX external so the published renderer uses the package's declared KaTeX dependency instead of rehype-katex's older private copy.
