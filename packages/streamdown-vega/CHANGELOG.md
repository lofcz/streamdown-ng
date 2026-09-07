# @lofcz/streamdown-vega

## 2.0.0

### Major Changes

- ed88b73: Add a generic SVG diagram plugin path and first-class Vega / Vega-Lite charts. Mermaid and PlantUML now share one renderer, controls, and download/fullscreen UI; extra engines can be registered via `plugins.diagrams`. Fenced `vega` / `vega-lite` / `vegalite` blocks render through `@lofcz/streamdown-vega`.

  Vega and PlantUML now follow the OpenSCAD engine-injection pattern: `createXPlugin({ engine })` plus a separate `./engine` entry so `vega` / `vega-lite` and `@plantuml/core` stay out of the bundler graph until the engine is imported.

## 1.0.0

### Major Changes

- Add first-class Vega / Vega-Lite charts. Fenced `vega`, `vega-lite`, and `vegalite` blocks render via `@lofcz/streamdown-vega`, which lazy-loads the Vega runtime and Vega-Lite compiler and produces SVG. Controls (copy, download SVG/PNG/JSON, fullscreen, pan-zoom) share the generic diagram path with Mermaid and PlantUML.
