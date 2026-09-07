"use client";

export const VEGA_LANGUAGES = ["vega", "vega-lite", "vegalite"] as const;

export type VegaLanguage = (typeof VEGA_LANGUAGES)[number];

export type VegaMode = "auto" | "vega" | "vega-lite";

export interface VegaConfig {
  /**
   * How to interpret the spec. `"auto"` uses the fence language and `$schema`.
   * @default "auto"
   */
  mode?: VegaMode;
}

export interface VegaView {
  finalize(): void;
  toSVG(): Promise<string>;
}

/**
 * Structural subset of the Vega runtime. Compatible with `import("vega")`
 * without a type dependency on that package in the main entry.
 */
export interface VegaRuntime {
  parse(spec: unknown): unknown;
  View: new (runtime: unknown, options?: { renderer?: string }) => VegaView;
}

/**
 * Structural subset of the Vega-Lite compiler.
 */
export interface VegaLiteRuntime {
  compile(spec: unknown): { spec: unknown };
}

/**
 * Engine access, injected so `vega` / `vega-lite` stay out of every
 * consumer's module graph — they are only resolved once `render()` runs.
 * Use the ready-made loader from `@lofcz/streamdown-vega/engine`.
 */
export interface VegaEngine {
  loadVega(): Promise<VegaRuntime>;
  loadVegaLite(): Promise<VegaLiteRuntime>;
}

export function createVegaEngine(
  loadVega: () => Promise<unknown>,
  loadVegaLite: () => Promise<unknown>
): VegaEngine {
  return {
    async loadVega() {
      return (await loadVega()) as VegaRuntime;
    },
    async loadVegaLite() {
      return (await loadVegaLite()) as VegaLiteRuntime;
    },
  };
}

export interface VegaInstance {
  render: (source: string, options?: VegaConfig) => Promise<{ svg: string }>;
}

export interface VegaPlugin {
  getVega: (config?: VegaConfig) => VegaInstance;
  language: readonly string[];
  name: "vega";
  render: (
    source: string,
    options?: VegaConfig & { language?: string }
  ) => Promise<{ svg: string }>;
  sourceExtension: "json";
  type: "diagram";
}

export interface VegaPluginOptions {
  config?: VegaConfig;
  engine: VegaEngine;
}

const VEGA_LITE_SCHEMA = /vega-lite/i;
const VEGA_SCHEMA = /\/vega\/v?\d/i;

export function isVegaLanguage(language: string): boolean {
  return (VEGA_LANGUAGES as readonly string[]).includes(language);
}

export function parseVegaSpec(source: string): unknown {
  const trimmed = source.trim();
  if (!trimmed) {
    throw new Error("Empty Vega spec");
  }
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid Vega spec JSON: ${message}`);
  }
}

export function resolveVegaMode(
  spec: unknown,
  language?: string,
  mode: VegaMode = "auto"
): "vega" | "vega-lite" {
  if (mode === "vega" || mode === "vega-lite") {
    return mode;
  }

  if (language === "vega-lite" || language === "vegalite") {
    return "vega-lite";
  }

  const schema =
    spec && typeof spec === "object" && "$schema" in spec
      ? String(spec.$schema)
      : "";

  if (VEGA_LITE_SCHEMA.test(schema)) {
    return "vega-lite";
  }
  if (VEGA_SCHEMA.test(schema)) {
    return "vega";
  }

  if (spec && typeof spec === "object" && "mark" in spec) {
    return "vega-lite";
  }

  return language === "vega" ? "vega" : "vega-lite";
}

interface Runtime {
  engine: VegaEngine;
  vegaLitePromise: Promise<VegaLiteRuntime> | null;
  vegaPromise: Promise<VegaRuntime> | null;
}

const runtimes = new WeakMap<VegaEngine, Runtime>();

function getRuntime(engine: VegaEngine): Runtime {
  let runtime = runtimes.get(engine);
  if (!runtime) {
    runtime = {
      engine,
      vegaPromise: null,
      vegaLitePromise: null,
    };
    runtimes.set(engine, runtime);
  }
  return runtime;
}

async function renderVega(
  engine: VegaEngine,
  source: string,
  options: VegaConfig & { language?: string } = {}
): Promise<{ svg: string }> {
  const spec = parseVegaSpec(source);
  const mode = resolveVegaMode(spec, options.language, options.mode);
  const runtime = getRuntime(engine);
  runtime.vegaPromise ??= runtime.engine.loadVega().catch((error) => {
    runtime.vegaPromise = null;
    throw error;
  });
  const vega = await runtime.vegaPromise;

  let vegaSpec = spec;
  if (mode === "vega-lite") {
    runtime.vegaLitePromise ??= runtime.engine.loadVegaLite().catch((error) => {
      runtime.vegaLitePromise = null;
      throw error;
    });
    const vegaLite = await runtime.vegaLitePromise;
    vegaSpec = vegaLite.compile(spec).spec;
  }

  const view = new vega.View(vega.parse(vegaSpec), {
    renderer: "none",
  });

  try {
    const svg = await view.toSVG();
    if (!svg.includes("<svg")) {
      throw new Error("Vega did not produce an SVG");
    }
    return { svg };
  } finally {
    view.finalize();
  }
}

export function createVegaPlugin(options: VegaPluginOptions): VegaPlugin {
  const instance: VegaInstance = {
    async render(source, config) {
      return await renderVega(options.engine, source, {
        ...options.config,
        ...config,
      });
    },
  };

  const render = (
    source: string,
    config?: VegaConfig & { language?: string }
  ) => instance.render(source, { ...options.config, ...config });

  return {
    name: "vega",
    type: "diagram",
    language: VEGA_LANGUAGES,
    sourceExtension: "json",
    render,
    getVega(config?: VegaConfig) {
      if (!config) {
        return instance;
      }
      return {
        render: (source, renderConfig) =>
          instance.render(source, { ...config, ...renderConfig }),
      };
    },
  };
}
