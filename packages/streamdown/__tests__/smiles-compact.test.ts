import { describe, expect, it } from "vitest";
import {
  defaultSmilesCompactDrawing,
  readConfiguredCompactDrawing,
  withSmilesCompactDrawing,
} from "../lib/smiles/compact";

describe("defaultSmilesCompactDrawing", () => {
  it("is compact for reaction SMILES", () => {
    expect(defaultSmilesCompactDrawing("CCO.CC(=O)O>>CC(=O)OCC")).toBe(true);
  });

  it("is skeletal for molecules", () => {
    expect(defaultSmilesCompactDrawing("CC(=O)Oc1ccccc1C(=O)O")).toBe(false);
  });
});

describe("readConfiguredCompactDrawing", () => {
  it("reads a boolean and ignores anything else", () => {
    expect(readConfiguredCompactDrawing({ compactDrawing: true })).toBe(true);
    expect(readConfiguredCompactDrawing({ compactDrawing: false })).toBe(false);
    expect(
      readConfiguredCompactDrawing({ compactDrawing: "yes" })
    ).toBeUndefined();
    expect(readConfiguredCompactDrawing({})).toBeUndefined();
    expect(readConfiguredCompactDrawing(undefined)).toBeUndefined();
  });
});

describe("withSmilesCompactDrawing", () => {
  it("merges compactDrawing onto an existing config object", () => {
    expect(withSmilesCompactDrawing({ theme: "dark" }, true)).toEqual({
      theme: "dark",
      compactDrawing: true,
    });
    expect(withSmilesCompactDrawing(undefined, false)).toEqual({
      compactDrawing: false,
    });
  });
});
