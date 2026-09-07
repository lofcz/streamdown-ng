import { describe, expect, it } from "vitest";
import { engine } from "../engine";
import {
  createVegaEngine,
  createVegaPlugin,
  isVegaLanguage,
  parseVegaSpec,
  resolveVegaMode,
  VEGA_LANGUAGES,
} from "../index";

const BAR_CHART = `{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {"values": [{"a": "A", "b": 28}, {"a": "B", "b": 55}]},
  "mark": "bar",
  "encoding": {
    "x": {"field": "a", "type": "nominal"},
    "y": {"field": "b", "type": "quantitative"}
  }
}`;

const unusedEngine = createVegaEngine(
  () => Promise.reject(new Error("engine not loaded")),
  () => Promise.reject(new Error("engine not loaded"))
);

const vega = createVegaPlugin({ engine: unusedEngine });

describe("vega plugin", () => {
  it("has correct name, type, and languages", () => {
    expect(vega.name).toBe("vega");
    expect(vega.type).toBe("diagram");
    expect(vega.language).toEqual(VEGA_LANGUAGES);
    expect(vega.sourceExtension).toBe("json");
    expect(typeof vega.getVega).toBe("function");
    expect(typeof vega.render).toBe("function");
  });

  it("createVegaPlugin returns independent instances", () => {
    const plugin1 = createVegaPlugin({ engine: unusedEngine });
    const plugin2 = createVegaPlugin({ engine: unusedEngine });
    expect(plugin1).not.toBe(plugin2);
    expect(plugin1.getVega).not.toBe(plugin2.getVega);
  });

  it("getVega returns a render function", () => {
    const instance = vega.getVega();
    expect(typeof instance.render).toBe("function");
  });
});

describe("isVegaLanguage", () => {
  it("accepts vega fence aliases", () => {
    expect(isVegaLanguage("vega")).toBe(true);
    expect(isVegaLanguage("vega-lite")).toBe(true);
    expect(isVegaLanguage("vegalite")).toBe(true);
  });

  it("rejects other languages", () => {
    expect(isVegaLanguage("mermaid")).toBe(false);
    expect(isVegaLanguage("json")).toBe(false);
    expect(isVegaLanguage("")).toBe(false);
  });
});

describe("parseVegaSpec", () => {
  it("parses a JSON spec", () => {
    expect(parseVegaSpec('{"mark":"bar"}')).toEqual({ mark: "bar" });
  });

  it("rejects empty input", () => {
    expect(() => parseVegaSpec("")).toThrow("Empty Vega spec");
    expect(() => parseVegaSpec("   ")).toThrow("Empty Vega spec");
  });

  it("rejects invalid JSON", () => {
    expect(() => parseVegaSpec("{not json")).toThrow("Invalid Vega spec JSON");
  });
});

describe("resolveVegaMode", () => {
  it("honors an explicit mode", () => {
    expect(resolveVegaMode({ mark: "bar" }, "vega", "vega")).toBe("vega");
    expect(resolveVegaMode({ marks: [] }, "vega", "vega-lite")).toBe(
      "vega-lite"
    );
  });

  it("uses the fence language for vega-lite aliases", () => {
    expect(resolveVegaMode({}, "vega-lite")).toBe("vega-lite");
    expect(resolveVegaMode({}, "vegalite")).toBe("vega-lite");
  });

  it("uses $schema when language is vega", () => {
    expect(
      resolveVegaMode(
        { $schema: "https://vega.github.io/schema/vega-lite/v5.json" },
        "vega"
      )
    ).toBe("vega-lite");
    expect(
      resolveVegaMode(
        { $schema: "https://vega.github.io/schema/vega/v5.json" },
        "vega"
      )
    ).toBe("vega");
  });

  it("treats a mark field as Vega-Lite", () => {
    expect(resolveVegaMode({ mark: "point" }, "vega")).toBe("vega-lite");
  });
});

describe("render", () => {
  it("renders a Vega-Lite bar chart to SVG", async () => {
    const plugin = createVegaPlugin({ engine });
    const { svg } = await plugin.render(BAR_CHART, { language: "vega-lite" });
    expect(svg).toContain("<svg");
  });
});
