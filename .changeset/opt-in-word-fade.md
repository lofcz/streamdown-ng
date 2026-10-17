---
"@lofcz/streamdown": patch
---

Load the word fade from `@lofcz/streamdown/animate` on demand with either the main or core entry. Streaming-mode components with `animated` set share a load after their first client commit, even while `isAnimating` is false. Static history and components without `animated` never request it. Text stays readable while loading, already-visible words stay settled, and later text animates. Failed loads can retry on later updates with bounded backoff.

Pass `plugins={{ animate }}` from `@lofcz/streamdown/animate` together with `animated` to animate from the first render. `createAnimatePlugin` remains available from the main entry and is also exported from the animation entry.

Preserve fork effects, smoothing, browser animation draining, processor identity isolation, and active fade timing across streaming updates. Block animation history follows stable block IDs across head edits and growing lines. Effect callback changes are recognized, and eager effect seeds remain stable through server rendering and hydration.
