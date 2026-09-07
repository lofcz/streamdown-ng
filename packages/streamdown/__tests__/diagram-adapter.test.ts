import { describe, expect, it, vi } from "vitest";
import {
  collectDiagramPlugins,
  findDiagramPlugin,
  isMermaidPlugin,
  isPlantUmlPlugin,
  isSmilesPlugin,
  isSvgDiagramPlugin,
  isVegaPlugin,
  matchesPluginLanguage,
  toSvgDiagramPlugin,
} from "../lib/diagram/adapter";
import type { PluginConfig, SvgDiagramPlugin } from "../lib/plugin-types";

describe("matchesPluginLanguage", () => {
  it("matches a string language", () => {
    expect(matchesPluginLanguage("mermaid", "mermaid")).toBe(true);
    expect(matchesPluginLanguage("vega", "mermaid")).toBe(false);
  });

  it("matches an array of languages", () => {
    expect(matchesPluginLanguage("vega-lite", ["vega", "vega-lite"])).toBe(
      true
    );
    expect(matchesPluginLanguage("dot", ["vega", "vega-lite"])).toBe(false);
  });
});

describe("toSvgDiagramPlugin", () => {
  it("adapts a mermaid plugin to render(source)", async () => {
    const render = vi.fn().mockResolvedValue({ svg: "<svg>m</svg>" });
    const plugin = toSvgDiagramPlugin({
      name: "mermaid",
      type: "diagram",
      language: "mermaid",
      getMermaid: () => ({
        initialize: vi.fn(),
        render,
      }),
    });

    expect(plugin.sourceExtension).toBe("mmd");
    const result = await plugin.render("graph TD; A-->B;");
    expect(result.svg).toBe("<svg>m</svg>");
    expect(render).toHaveBeenCalled();
  });

  it("adapts a plantuml plugin and passes dark", async () => {
    const render = vi.fn().mockResolvedValue({ svg: "<svg>p</svg>" });
    const plugin = toSvgDiagramPlugin({
      name: "plantuml",
      type: "diagram",
      language: ["plantuml", "puml"],
      getPlantUml: () => ({ render }),
    });

    expect(plugin.sourceExtension).toBe("puml");
    await plugin.render("Alice -> Bob");
    expect(render).toHaveBeenCalledWith("Alice -> Bob", {
      dark: false,
    });
  });

  it("adapts a smiles plugin", async () => {
    const render = vi.fn().mockResolvedValue({ svg: "<svg>s</svg>" });
    const plugin = toSvgDiagramPlugin({
      name: "smiles",
      type: "diagram",
      language: ["smiles", "smi"],
      sourceExtension: "smi",
      getSmiles: () => ({ render }),
    });

    const result = await plugin.render("CCO");
    expect(plugin.sourceExtension).toBe("smi");
    expect(result.svg).toBe("<svg>s</svg>");
    expect(render).toHaveBeenCalledWith("CCO", undefined);
  });

  it("adapts a vega plugin", async () => {
    const render = vi.fn().mockResolvedValue({ svg: "<svg>v</svg>" });
    const plugin = toSvgDiagramPlugin({
      name: "vega",
      type: "diagram",
      language: ["vega", "vega-lite"],
      sourceExtension: "json",
      getVega: () => ({ render }),
    });

    const result = await plugin.render('{"mark":"bar"}', {
      language: "vega-lite",
    });
    expect(result.svg).toBe("<svg>v</svg>");
    expect(render).toHaveBeenCalled();
  });

  it("passes through a native SvgDiagramPlugin", () => {
    const native: SvgDiagramPlugin = {
      name: "d2",
      type: "diagram",
      language: "d2",
      sourceExtension: "d2",
      render: vi.fn(),
    };
    expect(toSvgDiagramPlugin(native)).toBe(native);
    expect(isSvgDiagramPlugin(native)).toBe(true);
  });
});

describe("collectDiagramPlugins", () => {
  it("returns an empty list without config", () => {
    expect(collectDiagramPlugins(null)).toEqual([]);
  });

  it("collects named slots then plugins.diagrams", () => {
    const extra: SvgDiagramPlugin = {
      name: "d2",
      type: "diagram",
      language: "d2",
      render: vi.fn(),
    };
    const config: PluginConfig = {
      mermaid: {
        name: "mermaid",
        type: "diagram",
        language: "mermaid",
        getMermaid: () => ({
          initialize: vi.fn(),
          render: vi.fn(),
        }),
      },
      vega: {
        name: "vega",
        type: "diagram",
        language: ["vega"],
        getVega: () => ({ render: vi.fn() }),
      },
      smiles: {
        name: "smiles",
        type: "diagram",
        language: ["smiles", "smi"],
        getSmiles: () => ({ render: vi.fn() }),
      },
      diagrams: [extra],
    };

    const collected = collectDiagramPlugins(config);
    expect(collected.map((plugin) => plugin.name)).toEqual([
      "mermaid",
      "vega",
      "smiles",
      "d2",
    ]);
    expect(findDiagramPlugin(collected, "d2")?.name).toBe("d2");
    expect(findDiagramPlugin(collected, "missing")).toBeNull();
  });
});

describe("plugin guards", () => {
  it("identifies mermaid, plantuml, vega, and smiles plugins", () => {
    expect(
      isMermaidPlugin({
        name: "mermaid",
        type: "diagram",
        language: "mermaid",
        getMermaid: vi.fn(),
      })
    ).toBe(true);
    expect(
      isPlantUmlPlugin({
        name: "plantuml",
        type: "diagram",
        language: ["plantuml"],
        getPlantUml: vi.fn(),
      })
    ).toBe(true);
    expect(
      isVegaPlugin({
        name: "vega",
        type: "diagram",
        language: ["vega"],
        getVega: vi.fn(),
      })
    ).toBe(true);
    expect(
      isSmilesPlugin({
        name: "smiles",
        type: "diagram",
        language: ["smiles"],
        getSmiles: vi.fn(),
      })
    ).toBe(true);
  });
});
