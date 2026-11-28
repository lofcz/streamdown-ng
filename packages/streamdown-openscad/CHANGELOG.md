# @lofcz/streamdown-openscad

## 0.3.0

### Minor Changes

- 1beb045: Report OpenSCAD warnings for models that still render. OpenSCAD skips an unknown module, function or variable with only a `WARNING:` line, so the model exports with that part missing and nothing told the reader or the host.

  - **@lofcz/streamdown-openscad**: `render()` results carry `warnings: string[]`, collected apart from the log tail so a long render log cannot push them out.
  - **@lofcz/streamdown**: `openscad.warningComponent` is rendered with `{ code, warnings }` next to a model whose render reported warnings, tied to the source they are about. A host can explain the gap or have the source corrected, as `errorComponent` does for a failed render.

## 0.2.0

### Minor Changes

- 83936c3: Add first-class OpenSCAD models. Fenced `openscad` / `scad` blocks render via `@lofcz/streamdown-openscad`, which lazy-loads the `@lofcz/openscad-wasm` engine (bundler graph only — the engine entry is a separate import so apps that don't use it never pull the ~11MB wasm) and displays the result with an interactive three.js viewer in its own lazy chunk. Format auto-selection keeps `color()` models as 3MF and everything else as binary STL; font/MCAD bundles load only when the source uses `text()` / MCAD includes. Controls (copy, download SCAD/STL/3MF, fullscreen) match PlantUML.

## 0.1.0

### Minor Changes

- Add first-class OpenSCAD models. Fenced `openscad` / `scad` blocks render via `@lofcz/streamdown-openscad`, which lazy-loads the `@lofcz/openscad-wasm` engine and displays the result with an interactive three.js viewer. Controls (copy, download SCAD/STL/3MF, fullscreen) match PlantUML.
