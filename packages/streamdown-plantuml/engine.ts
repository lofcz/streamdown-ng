import { createPlantUmlEngine } from "./index";

type VizGlobal = typeof globalThis & { Viz?: unknown };

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-plantuml-viz="true"]'
    );
    if (existing) {
      if ((globalThis as VizGlobal).Viz) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () =>
          reject(new Error("Failed to load PlantUML Graphviz (viz-global.js)")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.plantumlViz = "true";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load PlantUML Graphviz (viz-global.js)"));
    document.head.appendChild(script);
  });
}

async function loadViz(): Promise<void> {
  const g = globalThis as VizGlobal;
  if (g.Viz) {
    return;
  }
  if (typeof document === "undefined") {
    throw new Error("PlantUML rendering requires a browser");
  }

  try {
    const vizUrlMod = await import(
      /* webpackChunkName: "plantuml-viz" */
      "@plantuml/core/viz-global.js?url"
    );
    if (typeof vizUrlMod.default === "string") {
      await loadScript(vizUrlMod.default);
      if (g.Viz) {
        return;
      }
    }
  } catch {
    // Bundler may not support `?url` — fall through to a module import.
  }

  const vizMod = await import(
    /* webpackChunkName: "plantuml-viz" */
    "@plantuml/core/viz-global.js"
  );
  if (!g.Viz) {
    g.Viz = vizMod.default ?? vizMod;
  }
}

/**
 * Bundler-graph engine loader for `@plantuml/core`.
 *
 * This is a separate entry point on purpose: importing it is what pulls the
 * TeaVM engine and Graphviz helper into your bundler's module graph. Apps
 * that never import this entry keep both completely out of their build.
 *
 * Requires `@plantuml/core` to be installed (optional peer dependency).
 */
export const engine = createPlantUmlEngine(
  /* webpackChunkName: "plantuml-engine" */
  () => import("@plantuml/core/plantuml.js"),
  loadViz
);
