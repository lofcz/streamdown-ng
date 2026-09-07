# @lofcz/streamdown-smiles

## 2.0.1

### Patch Changes

- f564f15: Wait to parse Vega and SMILES until the fence closes, and add a SMILES toolbar toggle between skeletal structures and SmilesDrawer compact notation (CH₃ / COOH).

## 2.0.0

### Major Changes

- ed88b73: Add a first-class SMILES chemical structure plugin. Fenced `smiles` / `smi` blocks render through `@lofcz/streamdown-smiles` (SmilesDrawer) on the shared SVG diagram path, with the same download, fullscreen, and pan/zoom controls as Mermaid, PlantUML, and Vega.

  SMILES follows the OpenSCAD engine-injection pattern: `createSmilesPlugin({ engine })` plus a separate `./engine` entry so `smiles-drawer` stays out of the bundler graph until the engine is imported.
