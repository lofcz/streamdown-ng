---
"@lofcz/streamdown": minor
"@lofcz/streamdown-vega": major
"@lofcz/streamdown-plantuml": major
---

Add a generic SVG diagram plugin path and first-class Vega / Vega-Lite charts. Mermaid and PlantUML now share one renderer, controls, and download/fullscreen UI; extra engines can be registered via `plugins.diagrams`. Fenced `vega` / `vega-lite` / `vegalite` blocks render through `@lofcz/streamdown-vega`.

Vega and PlantUML now follow the OpenSCAD engine-injection pattern: `createXPlugin({ engine })` plus a separate `./engine` entry so `vega` / `vega-lite` and `@plantuml/core` stay out of the bundler graph until the engine is imported.
