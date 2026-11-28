---
"@lofcz/streamdown": minor
"@lofcz/streamdown-openscad": minor
---

Report OpenSCAD warnings for models that still render. OpenSCAD skips an unknown module, function or variable with only a `WARNING:` line, so the model exports with that part missing and nothing told the reader or the host.

- **@lofcz/streamdown-openscad**: `render()` results carry `warnings: string[]`, collected apart from the log tail so a long render log cannot push them out.
- **@lofcz/streamdown**: `openscad.warningComponent` is rendered with `{ code, warnings }` next to a model whose render reported warnings, tied to the source they are about. A host can explain the gap or have the source corrected, as `errorComponent` does for a failed render.
