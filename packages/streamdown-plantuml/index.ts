"use client";

export const PLANTUML_LANGUAGES = ["plantuml", "puml"] as const;

export type PlantUmlLanguage = (typeof PLANTUML_LANGUAGES)[number];

export interface PlantUmlConfig {
  dark?: boolean;
}

export interface PlantUmlInstance {
  render: (
    source: string,
    options?: PlantUmlConfig
  ) => Promise<{ svg: string }>;
}

export interface PlantUmlPlugin {
  getPlantUml: (config?: PlantUmlConfig) => PlantUmlInstance;
  language: readonly string[];
  name: "plantuml";
  type: "diagram";
}

/**
 * Structural subset of `@plantuml/core/plantuml.js`. Compatible without a
 * type dependency on that package in the main entry.
 */
export interface PlantUmlCore {
  render(lines: string[], targetId: string, options?: { dark?: boolean }): void;
  renderToString(
    lines: string[],
    onSuccess: (svg: string) => void,
    onError: (message: string) => void
  ): void;
}

/**
 * Engine access, injected so `@plantuml/core` stays out of every consumer's
 * module graph — it is only resolved once `render()` runs.
 * Use the ready-made loader from `@lofcz/streamdown-plantuml/engine`.
 */
export interface PlantUmlEngine {
  load(): Promise<PlantUmlCore>;
  loadViz(): Promise<void>;
}

export function createPlantUmlEngine(
  load: () => Promise<unknown>,
  loadViz: PlantUmlEngine["loadViz"]
): PlantUmlEngine {
  return {
    async load() {
      return (await load()) as PlantUmlCore;
    },
    loadViz,
  };
}

export interface PlantUmlPluginOptions {
  config?: PlantUmlConfig;
  engine: PlantUmlEngine;
}

const START_DIRECTIVE = /^@start\w+/im;
const LINE_SPLIT = /\r\n|\r|\n/;

/**
 * Ensure the source has a PlantUML `@start…` / `@end…` pair. Agents often
 * emit the diagram body only; the TeaVM engine requires the directives.
 */
export function normalizePlantUmlSource(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (START_DIRECTIVE.test(trimmed)) {
    return trimmed;
  }
  return `@startuml\n${trimmed}\n@enduml`;
}

export function isPlantUmlLanguage(language: string): boolean {
  return (PLANTUML_LANGUAGES as readonly string[]).includes(language);
}

interface Runtime {
  corePromise: Promise<PlantUmlCore> | null;
  engine: PlantUmlEngine;
  queue: Promise<unknown>;
  vizPromise: Promise<void> | null;
}

const runtimes = new WeakMap<PlantUmlEngine, Runtime>();

function getRuntime(engine: PlantUmlEngine): Runtime {
  let runtime = runtimes.get(engine);
  if (!runtime) {
    runtime = {
      engine,
      corePromise: null,
      vizPromise: null,
      queue: Promise.resolve(),
    };
    runtimes.set(engine, runtime);
  }
  return runtime;
}

function enqueue<T>(runtime: Runtime, work: () => Promise<T>): Promise<T> {
  const next = runtime.queue.then(work, work);
  runtime.queue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function renderViaDom(
  render: PlantUmlCore["render"],
  lines: string[],
  dark: boolean
): Promise<string> {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("PlantUML rendering requires a browser"));
  }

  const id = `plantuml-sd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const host = document.createElement("div");
  host.id = id;
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:absolute;left:-99999px;top:-99999px;width:0;height:0;overflow:hidden;";
  document.body.appendChild(host);

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const observer = new MutationObserver(() => {
      if (host.querySelector("svg")) {
        finish(() => resolve(host.innerHTML));
      }
    });

    const timeout = window.setTimeout(() => {
      finish(() => reject(new Error("PlantUML render timed out")));
    }, 30_000);

    const finish = (fn: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeout);
      observer.disconnect();
      host.remove();
      fn();
    };

    observer.observe(host, { childList: true, subtree: true });

    try {
      render(lines, id, { dark });
    } catch (error) {
      finish(() =>
        reject(error instanceof Error ? error : new Error(String(error)))
      );
    }
  });
}

function renderViaString(
  renderToString: PlantUmlCore["renderToString"],
  lines: string[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    renderToString(lines, resolve, (message) => reject(new Error(message)));
  });
}

async function renderPlantUml(
  engine: PlantUmlEngine,
  source: string,
  options: PlantUmlConfig = {}
): Promise<{ svg: string }> {
  const runtime = getRuntime(engine);
  runtime.vizPromise ??= runtime.engine.loadViz().catch((error) => {
    runtime.vizPromise = null;
    throw error;
  });
  runtime.corePromise ??= runtime.engine.load().catch((error) => {
    runtime.corePromise = null;
    throw error;
  });
  await runtime.vizPromise;
  const core = await runtime.corePromise;
  const normalized = normalizePlantUmlSource(source);
  if (!normalized) {
    throw new Error("Empty PlantUML source");
  }
  const lines = normalized.split(LINE_SPLIT);
  const dark = options.dark === true;

  const svg = await enqueue(runtime, async () => {
    if (dark) {
      return renderViaDom(core.render, lines, true);
    }
    try {
      return await renderViaString(core.renderToString, lines);
    } catch (stringError) {
      try {
        return await renderViaDom(core.render, lines, false);
      } catch {
        throw stringError;
      }
    }
  });

  if (!svg.includes("<svg")) {
    throw new Error("PlantUML did not produce an SVG");
  }

  return { svg };
}

export function createPlantUmlPlugin(
  options: PlantUmlPluginOptions
): PlantUmlPlugin {
  const plantUmlInstance: PlantUmlInstance = {
    async render(source: string, config?: PlantUmlConfig) {
      return await renderPlantUml(options.engine, source, {
        ...options.config,
        ...config,
      });
    },
  };

  return {
    name: "plantuml",
    type: "diagram",
    language: PLANTUML_LANGUAGES,
    getPlantUml(config?: PlantUmlConfig) {
      if (!config) {
        return plantUmlInstance;
      }
      return {
        render: (source, renderConfig) =>
          plantUmlInstance.render(source, { ...config, ...renderConfig }),
      };
    },
  };
}
