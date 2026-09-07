"use client";

export const SMILES_LANGUAGES = ["smiles", "smi"] as const;

export type SmilesLanguage = (typeof SMILES_LANGUAGES)[number];

/** Built-in SmilesDrawer themes. `oldschool` is monochrome (no element colors). */
export type SmilesDrawerTheme = "light" | "dark" | "oldschool";

export type SmilesTheme = SmilesDrawerTheme | "auto";

export interface SmilesConfig {
  /**
   * When false, force the monochrome `oldschool` theme.
   * @default true
   */
  elementColors?: boolean;
  /**
   * Canvas height in CSS pixels.
   * @default 220
   */
  height?: number;
  /**
   * `"auto"` follows the page dark theme (`class="dark"`, `data-theme`,
   * `data-color-mode`). `elementColors: false` overrides this to `oldschool`.
   * @default "auto"
   */
  theme?: SmilesTheme;
  /**
   * Canvas width in CSS pixels.
   * @default 320
   */
  width?: number;
}

export interface SmiDrawer {
  draw(
    smiles: string,
    target: SVGSVGElement,
    theme: string,
    onSuccess: () => void,
    onError: (err: unknown) => void
  ): void;
}

/**
 * Structural subset of `smiles-drawer`. Compatible without a type
 * dependency on that package in the main entry.
 */
export interface SmilesDrawerRuntime {
  SmiDrawer: new (options: {
    compactDrawing?: boolean;
    height: number;
    width: number;
  }) => SmiDrawer;
}

/**
 * Engine access, injected so `smiles-drawer` stays out of every consumer's
 * module graph — it is only resolved once `render()` runs.
 * Use the ready-made loader from `@lofcz/streamdown-smiles/engine`.
 */
export interface SmilesEngine {
  load(): Promise<SmilesDrawerRuntime>;
}

export function createSmilesEngine(load: () => Promise<unknown>): SmilesEngine {
  return {
    async load() {
      return toRuntime(await load());
    },
  };
}

export interface SmilesInstance {
  render: (source: string, options?: SmilesConfig) => Promise<{ svg: string }>;
}

export interface SmilesPlugin {
  getSmiles: (config?: SmilesConfig) => SmilesInstance;
  language: readonly string[];
  name: "smiles";
  render: (source: string, options?: SmilesConfig) => Promise<{ svg: string }>;
  sourceExtension: "smi";
  type: "diagram";
}

export interface SmilesPluginOptions {
  config?: SmilesConfig;
  engine: SmilesEngine;
}

const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 220;
const SVG_NS = "http://www.w3.org/2000/svg";
const FIRST_TOKEN = /\s+/;

export function isSmilesLanguage(language: string): boolean {
  return (SMILES_LANGUAGES as readonly string[]).includes(language);
}

/**
 * Mirror SmilesDrawer.SmiDrawer.draw: first whitespace-separated token is the
 * SMILES; a `>` means reaction (`reactants>reagents>products`).
 */
export function isReactionSmiles(smiles: string): boolean {
  const token = smiles.trim().split(FIRST_TOKEN, 1).at(0) ?? "";
  return token.includes(">");
}

export function prefersDarkTheme(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  const root = document.documentElement;
  return (
    root.classList.contains("dark") ||
    root.dataset.theme === "dark" ||
    root.dataset.colorMode === "dark"
  );
}

export function resolveSmilesTheme(
  options: SmilesConfig = {}
): SmilesDrawerTheme {
  if (options.elementColors === false) {
    return "oldschool";
  }
  if (
    options.theme === "light" ||
    options.theme === "dark" ||
    options.theme === "oldschool"
  ) {
    return options.theme;
  }
  return prefersDarkTheme() ? "dark" : "light";
}

function toRuntime(mod: unknown): SmilesDrawerRuntime {
  if (hasSmiDrawer(mod)) {
    return mod;
  }
  if (mod && typeof mod === "object" && "default" in mod) {
    const ns = mod.default;
    if (hasSmiDrawer(ns)) {
      return ns;
    }
  }
  throw new Error("smiles-drawer did not export SmiDrawer");
}

function hasSmiDrawer(value: unknown): value is SmilesDrawerRuntime {
  return (
    (typeof value === "object" || typeof value === "function") &&
    !!value &&
    "SmiDrawer" in value &&
    typeof (value as SmilesDrawerRuntime).SmiDrawer === "function"
  );
}

interface Runtime {
  engine: SmilesEngine;
  smilesPromise: Promise<SmilesDrawerRuntime> | null;
}

const runtimes = new WeakMap<SmilesEngine, Runtime>();

function getRuntime(engine: SmilesEngine): Runtime {
  let runtime = runtimes.get(engine);
  if (!runtime) {
    runtime = {
      engine,
      smilesPromise: null,
    };
    runtimes.set(engine, runtime);
  }
  return runtime;
}

const createSmiDrawer = (
  SmilesDrawer: SmilesDrawerRuntime,
  width: number,
  height: number,
  smiles: string
) =>
  new SmilesDrawer.SmiDrawer({
    width,
    height,
    compactDrawing: isReactionSmiles(smiles),
  });

const ensureTitle = (svg: SVGSVGElement) => {
  if (svg.querySelector("title")) {
    return;
  }
  const title = document.createElementNS(SVG_NS, "title");
  title.textContent = "Chemical structure";
  svg.insertBefore(title, svg.firstChild);
};

async function renderSmiles(
  engine: SmilesEngine,
  source: string,
  options: SmilesConfig = {}
): Promise<{ svg: string }> {
  if (typeof document === "undefined") {
    throw new Error("SMILES rendering requires a browser");
  }

  const trimmed = source.trim();
  if (!trimmed) {
    throw new Error("Empty SMILES");
  }

  const runtime = getRuntime(engine);
  runtime.smilesPromise ??= runtime.engine.load().catch((error) => {
    runtime.smilesPromise = null;
    throw error;
  });
  const SmilesDrawer = await runtime.smilesPromise;
  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const theme = resolveSmilesTheme(options);

  // Do not pre-set viewBox — SvgWrapper.updateViewbox writes a tight bbox
  // (often with non-zero minX/minY). Overwriting that with 0 0 W H clips.
  const scratch = document.createElementNS(SVG_NS, "svg");
  scratch.setAttribute("xmlns", SVG_NS);
  scratch.setAttribute("width", String(width));
  scratch.setAttribute("height", String(height));

  const drawer = createSmiDrawer(SmilesDrawer, width, height, trimmed);

  await new Promise<void>((resolve, reject) => {
    drawer.draw(
      trimmed,
      scratch,
      theme,
      () => resolve(),
      (err: unknown) =>
        reject(err instanceof Error ? err : new Error(String(err)))
    );
  });

  scratch.style.removeProperty("width");
  scratch.style.removeProperty("height");
  ensureTitle(scratch);

  const svg = scratch.outerHTML;
  if (!svg.includes("<svg")) {
    throw new Error("SMILES did not produce an SVG");
  }

  return { svg };
}

export function createSmilesPlugin(options: SmilesPluginOptions): SmilesPlugin {
  const instance: SmilesInstance = {
    async render(source, config) {
      return await renderSmiles(options.engine, source, {
        ...options.config,
        ...config,
      });
    },
  };

  const render = (source: string, config?: SmilesConfig) =>
    instance.render(source, { ...options.config, ...config });

  return {
    name: "smiles",
    type: "diagram",
    language: SMILES_LANGUAGES,
    sourceExtension: "smi",
    render,
    getSmiles(config?: SmilesConfig) {
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
