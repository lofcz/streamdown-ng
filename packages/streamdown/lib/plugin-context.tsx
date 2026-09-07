"use client";

import { createContext, useContext, useMemo } from "react";
import { collectDiagramPlugins, findDiagramPlugin } from "./diagram/adapter";
import type { PluginConfig, SvgDiagramPlugin } from "./plugin-types";

/**
 * Context for Streamdown plugins
 */
export const PluginContext = createContext<PluginConfig | null>(null);

/**
 * Hook to access all plugins
 */
export const usePlugins = (): PluginConfig | null => useContext(PluginContext);

/**
 * Hook to access the code plugin
 */
export const useCodePlugin = () => {
  const plugins = usePlugins();
  return plugins?.code ?? null;
};

/**
 * Hook to access the mermaid plugin
 */
export const useMermaidPlugin = () => {
  const plugins = usePlugins();
  return plugins?.mermaid ?? null;
};

/**
 * Hook to access the PlantUML plugin
 */
export const usePlantUmlPlugin = () => {
  const plugins = usePlugins();
  return plugins?.plantuml ?? null;
};

/**
 * Hook to access the Vega plugin
 */
export const useVegaPlugin = () => {
  const plugins = usePlugins();
  return plugins?.vega ?? null;
};

/**
 * Hook to access the SMILES plugin
 */
export const useSmilesPlugin = () => {
  const plugins = usePlugins();
  return plugins?.smiles ?? null;
};

/**
 * All SVG diagram plugins, including named mermaid / plantuml / vega / smiles
 * slots and extras from `plugins.diagrams`.
 */
export const useDiagramPlugins = (): SvgDiagramPlugin[] => {
  const plugins = usePlugins();
  return useMemo(() => collectDiagramPlugins(plugins), [plugins]);
};

/**
 * Find an SVG diagram plugin for a fence language.
 */
export const useDiagramPlugin = (language: string): SvgDiagramPlugin | null => {
  const diagrams = useDiagramPlugins();
  return findDiagramPlugin(diagrams, language);
};

/**
 * Hook to access the OpenSCAD plugin
 */
export const useOpenScadPlugin = () => {
  const plugins = usePlugins();
  return plugins?.openscad ?? null;
};

/**
 * Hook to access the math plugin
 */
export const useMathPlugin = () => {
  const plugins = usePlugins();
  return plugins?.math ?? null;
};

/**
 * Hook to access the cjk plugin
 */
export const useCjkPlugin = () => {
  const plugins = usePlugins();
  return plugins?.cjk ?? null;
};

/**
 * Hook to find a custom renderer for a given language
 */
export const useCustomRenderer = (language: string) => {
  const plugins = usePlugins();
  if (!(plugins?.renderers && language)) {
    return null;
  }
  return (
    plugins.renderers.find((r) =>
      Array.isArray(r.language)
        ? r.language.includes(language)
        : r.language === language
    ) ?? null
  );
};
