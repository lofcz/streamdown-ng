# @lofcz/streamdown-vega

## 1.0.0

### Major Changes

- Add first-class Vega / Vega-Lite charts. Fenced `vega`, `vega-lite`, and `vegalite` blocks render via `@lofcz/streamdown-vega`, which lazy-loads the Vega runtime and Vega-Lite compiler and produces SVG. Controls (copy, download SVG/PNG/JSON, fullscreen, pan-zoom) share the generic diagram path with Mermaid and PlantUML.
