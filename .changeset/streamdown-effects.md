---
"@lofcz/streamdown-effects": patch
---

Add `@lofcz/streamdown-effects` with `diffuse` and `scramble`.

Diffusion-style streaming effects for `animated.animation`. `diffuse` sharpens words out of a blur in scattered order. `scramble` shows noise glyphs that resolve to the real text, keeping the real words in the DOM for copy and assistive technology.

```tsx
import { scramble } from "@lofcz/streamdown-effects";
import "@lofcz/streamdown-effects/styles.css";

<Streamdown animated={{ animation: scramble }} isAnimating={isStreaming} smooth>
  {markdown}
</Streamdown>
```
