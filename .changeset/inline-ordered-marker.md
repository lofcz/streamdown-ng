---
"@lofcz/streamdown": patch
---

Stop treating a number right after a list marker (`- 23. října`, `1. 23) foo`) as a nested ordered list. Per CommonMark it is one, but in streamed prose it is a date or a count, so the marker is folded back into the item text when the nested list is inline and has a single item. Deliberate nested lists on their own indented lines are unchanged.
