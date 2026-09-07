import { describe, expect, it } from "vitest";
import { engine } from "../engine";
import {
  createSmilesEngine,
  createSmilesPlugin,
  isReactionSmiles,
  isSmilesLanguage,
  resolveSmilesTheme,
  SMILES_LANGUAGES,
} from "../index";

const ASPIRIN = "CC(=O)Oc1ccccc1C(=O)O";
const ESTERIFICATION = "CCO.CC(=O)O>>CC(=O)OCC";

const unusedEngine = createSmilesEngine(() =>
  Promise.reject(new Error("engine not loaded"))
);

const smiles = createSmilesPlugin({ engine: unusedEngine });

describe("smiles plugin", () => {
  it("has correct name, type, and languages", () => {
    expect(smiles.name).toBe("smiles");
    expect(smiles.type).toBe("diagram");
    expect(smiles.language).toEqual(SMILES_LANGUAGES);
    expect(smiles.sourceExtension).toBe("smi");
    expect(typeof smiles.getSmiles).toBe("function");
    expect(typeof smiles.render).toBe("function");
  });

  it("createSmilesPlugin returns independent instances", () => {
    const plugin1 = createSmilesPlugin({ engine: unusedEngine });
    const plugin2 = createSmilesPlugin({ engine: unusedEngine });
    expect(plugin1).not.toBe(plugin2);
    expect(plugin1.getSmiles).not.toBe(plugin2.getSmiles);
  });

  it("getSmiles returns a render function", () => {
    const instance = smiles.getSmiles();
    expect(typeof instance.render).toBe("function");
  });
});

describe("isSmilesLanguage", () => {
  it("accepts smiles and smi", () => {
    expect(isSmilesLanguage("smiles")).toBe(true);
    expect(isSmilesLanguage("smi")).toBe(true);
  });

  it("rejects other languages", () => {
    expect(isSmilesLanguage("chemistry")).toBe(false);
    expect(isSmilesLanguage("mermaid")).toBe(false);
    expect(isSmilesLanguage("")).toBe(false);
  });
});

describe("isReactionSmiles", () => {
  it("detects reaction arrows in the first token", () => {
    expect(isReactionSmiles(ESTERIFICATION)).toBe(true);
    expect(isReactionSmiles("CCO>>CC=O  extra")).toBe(true);
  });

  it("treats molecules as non-reactions", () => {
    expect(isReactionSmiles(ASPIRIN)).toBe(false);
    expect(isReactionSmiles("CCO")).toBe(false);
    expect(isReactionSmiles("")).toBe(false);
  });
});

describe("resolveSmilesTheme", () => {
  it("uses oldschool when element colors are disabled", () => {
    expect(resolveSmilesTheme({ theme: "dark", elementColors: false })).toBe(
      "oldschool"
    );
  });

  it("honors an explicit theme", () => {
    expect(resolveSmilesTheme({ theme: "dark" })).toBe("dark");
    expect(resolveSmilesTheme({ theme: "light" })).toBe("light");
    expect(resolveSmilesTheme({ theme: "oldschool" })).toBe("oldschool");
  });

  it("defaults to light when the page is not dark", () => {
    expect(resolveSmilesTheme()).toBe("light");
    expect(resolveSmilesTheme({ theme: "auto" })).toBe("light");
  });
});

describe("render", () => {
  it("rejects empty input", async () => {
    await expect(smiles.render("")).rejects.toThrow("Empty SMILES");
    await expect(smiles.render("   ")).rejects.toThrow("Empty SMILES");
  });

  it("renders a molecule SMILES to SVG", async () => {
    const plugin = createSmilesPlugin({ engine });
    const { svg } = await plugin.render(ASPIRIN);
    expect(svg).toContain("<svg");
    expect(svg).toContain("<title>");
  });

  it("renders a reaction SMILES to SVG", async () => {
    const plugin = createSmilesPlugin({ engine });
    const { svg } = await plugin.render(ESTERIFICATION);
    expect(svg).toContain("<svg");
  });
});
