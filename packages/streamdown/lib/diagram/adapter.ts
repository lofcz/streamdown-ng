import { autoFixMermaidChart } from "../mermaid/auto-fix";
import type {
  DiagramPlugin,
  MermaidConfig,
  PlantUmlConfig,
  PlantUmlPlugin,
  PluginConfig,
  SmilesConfig,
  SmilesPlugin,
  SvgDiagramPlugin,
  VegaConfig,
  VegaPlugin,
} from "../plugin-types";

export type NamedDiagramPlugin =
  | DiagramPlugin
  | PlantUmlPlugin
  | VegaPlugin
  | SmilesPlugin
  | SvgDiagramPlugin;

const prefersDark = (): boolean => {
  if (typeof document === "undefined") {
    return false;
  }
  const root = document.documentElement;
  return (
    root.classList.contains("dark") ||
    root.dataset.theme === "dark" ||
    root.dataset.colorMode === "dark"
  );
};

export const matchesPluginLanguage = (
  language: string,
  pluginLanguage: string | readonly string[]
): boolean =>
  Array.isArray(pluginLanguage)
    ? pluginLanguage.includes(language)
    : pluginLanguage === language;

export const isMermaidPlugin = (
  plugin: NamedDiagramPlugin
): plugin is DiagramPlugin =>
  "getMermaid" in plugin && typeof plugin.getMermaid === "function";

export const isPlantUmlPlugin = (
  plugin: NamedDiagramPlugin
): plugin is PlantUmlPlugin =>
  "getPlantUml" in plugin && typeof plugin.getPlantUml === "function";

export const isVegaPlugin = (
  plugin: NamedDiagramPlugin
): plugin is VegaPlugin =>
  "getVega" in plugin && typeof plugin.getVega === "function";

export const isSmilesPlugin = (
  plugin: NamedDiagramPlugin
): plugin is SmilesPlugin =>
  "getSmiles" in plugin && typeof plugin.getSmiles === "function";

export const isSvgDiagramPlugin = (
  plugin: NamedDiagramPlugin
): plugin is SvgDiagramPlugin =>
  "render" in plugin && typeof plugin.render === "function";

const mermaidRenderId = (source: string): string => {
  const chartHash = source.split("").reduce((acc, char) => {
    // biome-ignore lint/suspicious/noBitwiseOperators: "Required for Mermaid"
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);
  return `mermaid-${Math.abs(chartHash)}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const renderMermaidWithAutoFix = async (
  mermaid: { render: (id: string, source: string) => Promise<{ svg: string }> },
  uniqueId: string,
  chart: string
): Promise<{ svg: string }> => {
  try {
    return await mermaid.render(uniqueId, chart);
  } catch (renderError) {
    const fixedChart = autoFixMermaidChart(chart);
    if (!fixedChart) {
      throw renderError;
    }
    try {
      return await mermaid.render(`${uniqueId}-autofix`, fixedChart);
    } catch {
      throw renderError;
    }
  }
};

export const toSvgDiagramPlugin = (
  plugin: NamedDiagramPlugin
): SvgDiagramPlugin => {
  if (isMermaidPlugin(plugin)) {
    return {
      name: plugin.name,
      type: "diagram",
      language: plugin.language,
      sourceExtension: "mmd",
      render: async (source, options) => {
        const mermaid = plugin.getMermaid(options as MermaidConfig | undefined);
        return await renderMermaidWithAutoFix(
          mermaid,
          mermaidRenderId(source),
          source
        );
      },
    };
  }

  if (isPlantUmlPlugin(plugin)) {
    return {
      name: plugin.name,
      type: "diagram",
      language: plugin.language,
      sourceExtension: "puml",
      render: async (source, options) => {
        const config = options as PlantUmlConfig | undefined;
        const dark = config?.dark ?? prefersDark();
        return await plugin.getPlantUml(config).render(source, {
          ...config,
          dark,
        });
      },
    };
  }

  if (isVegaPlugin(plugin)) {
    return {
      name: plugin.name,
      type: "diagram",
      language: plugin.language,
      sourceExtension: plugin.sourceExtension ?? "json",
      render: (source, options) =>
        plugin
          .getVega(options as VegaConfig | undefined)
          .render(source, options as VegaConfig | undefined),
    };
  }

  if (isSmilesPlugin(plugin)) {
    return {
      name: plugin.name,
      type: "diagram",
      language: plugin.language,
      sourceExtension: plugin.sourceExtension ?? "smi",
      render: (source, options) =>
        plugin
          .getSmiles(options as SmilesConfig | undefined)
          .render(source, options as SmilesConfig | undefined),
    };
  }

  return plugin;
};

export const collectDiagramPlugins = (
  config: PluginConfig | null
): SvgDiagramPlugin[] => {
  if (!config) {
    return [];
  }

  const named: NamedDiagramPlugin[] = [];
  if (config.mermaid) {
    named.push(config.mermaid);
  }
  if (config.plantuml) {
    named.push(config.plantuml);
  }
  if (config.vega) {
    named.push(config.vega);
  }
  if (config.smiles) {
    named.push(config.smiles);
  }

  return [...named, ...(config.diagrams ?? [])].map(toSvgDiagramPlugin);
};

export const findDiagramPlugin = (
  plugins: SvgDiagramPlugin[],
  language: string
): SvgDiagramPlugin | null =>
  plugins.find((plugin) => matchesPluginLanguage(language, plugin.language)) ??
  null;
