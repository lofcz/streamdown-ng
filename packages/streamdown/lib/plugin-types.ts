import type React from "react";
import type { Pluggable } from "unified";
import type {
  AnimateOptions,
  AnimatePlugin,
  AnimateTimeline,
  CreateAnimateTimelineOptions,
} from "./animate.js";
import type {
  BundledLanguage,
  BundledTheme,
  ThemeRegistrationAny,
} from "./shiki-types";

export type {
  BundledLanguage,
  BundledTheme,
  ThemeRegistrationAny,
} from "./shiki-types";

export type ThemeInput = BundledTheme | ThemeRegistrationAny;

/**
 * A single token in a highlighted line
 */
export interface HighlightToken {
  bgColor?: string | undefined;
  color?: string | undefined;
  content: string;
  htmlAttrs?: Record<string, string> | undefined;
  htmlStyle?: Record<string, string> | undefined;
  offset?: number | undefined;
}

/**
 * Result from code highlighting (compatible with shiki's TokensResult)
 */
export interface HighlightResult {
  bg?: string | undefined;
  fg?: string | undefined;
  rootStyle?: string | false | undefined;
  tokens: HighlightToken[][];
}

/**
 * Options for highlighting code
 */
export interface HighlightOptions {
  code: string;
  /**
   * Whether the code block is still streaming. Its result is superseded by
   * the next update, so plugins can avoid caching it long-term.
   */
  isIncomplete?: boolean | undefined;
  language: BundledLanguage;
  themes: [ThemeInput, ThemeInput];
}

/**
 * Plugin for code syntax highlighting (Shiki)
 *
 * Method syntax is intentional: parameter types stay bivariant so plugins
 * from `@streamdown/code` (which use Shiki's narrower language/theme unions)
 * remain assignable without requiring a `shiki` type dependency here.
 */
export interface CodeHighlighterPlugin {
  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): BundledLanguage[];
  /**
   * Get the configured themes
   */
  getThemes(): [ThemeInput, ThemeInput];
  /**
   * Highlight code and return tokens
   * Returns null if highlighting not ready yet (async loading)
   * Use callback for async result
   */
  highlight(
    options: HighlightOptions,
    callback?: (result: HighlightResult) => void
  ): HighlightResult | null;
  name: "shiki";
  /**
   * Check if language is supported
   */
  supportsLanguage(language: BundledLanguage): boolean;
  type: "code-highlighter";
}

/**
 * Structural type for Mermaid configuration pass-through.
 * Avoids a hard dependency on the "mermaid" package in the core bundle.
 */
export type MermaidConfig = {
  fontFamily?: string | undefined;
  securityLevel?: string | undefined;
  startOnLoad?: boolean | undefined;
  suppressErrorRendering?: boolean | undefined;
  theme?: string | undefined;
  themeCSS?: string | undefined;
  themeVariables?: Record<string, unknown> | undefined;
  // biome-ignore lint/suspicious/noExplicitAny: open pass-through for mermaid options
} & Record<string, any>;

/**
 * Mermaid instance interface.
 *
 * Method syntax is intentional: parameter types stay bivariant so
 * `@streamdown/mermaid` (which uses mermaid's narrower `MermaidConfig`) remains
 * assignable without a core type dependency on the mermaid package.
 */
export interface MermaidInstance {
  initialize(config: MermaidConfig): void;
  render(id: string, source: string): Promise<{ svg: string }>;
}

/**
 * Plugin for diagram rendering (Mermaid).
 *
 * Method syntax on `getMermaid` matches `CodeHighlighterPlugin` — keeps plugin
 * implementations with narrower config types assignable under
 * `strictFunctionTypes`.
 */
export interface DiagramPlugin {
  /**
   * Get the mermaid instance (initialized with optional config)
   */
  getMermaid(config?: MermaidConfig): MermaidInstance;
  /**
   * Language identifier for code blocks
   */
  language: string;
  name: "mermaid";
  type: "diagram";
}

/**
 * Shared SVG diagram contract used by the generic renderer.
 * Mermaid and PlantUML are adapted to this shape in core; Vega implements it
 * natively. Extra engines (Graphviz, D2, …) can be passed via `plugins.diagrams`.
 */
export interface SvgDiagramPlugin {
  /**
   * Language identifiers for code blocks
   */
  language: string | readonly string[];
  name: string;
  /**
   * Render source to an SVG string. `options` is plugin-specific and may
   * include a `language` field for engines that handle multiple fences.
   */
  render: (source: string, options?: unknown) => Promise<{ svg: string }>;
  /**
   * File extension (no dot) used when downloading the source.
   * @default "txt"
   */
  sourceExtension?: string;
  type: "diagram";
  /** Defer expensive/strict renderers until the streaming code fence closes. */
  waitForClosedFence?: boolean;
}

/**
 * Structural type for Vega / Vega-Lite configuration.
 * Avoids a hard dependency on `vega` / `vega-lite` in the core bundle.
 */
export interface VegaConfig {
  /**
   * How to interpret the spec. `"auto"` uses the fence language and `$schema`.
   */
  mode?: "auto" | "vega" | "vega-lite";
}

export interface VegaInstance {
  render: (source: string, options?: VegaConfig) => Promise<{ svg: string }>;
}

/**
 * Plugin for diagram rendering (Vega / Vega-Lite)
 */
export interface VegaPlugin {
  /**
   * Get the Vega instance (initialized with optional config)
   */
  getVega: (config?: VegaConfig) => VegaInstance;
  /**
   * Language identifiers for code blocks (`vega`, `vega-lite`, `vegalite`)
   */
  language: string | readonly string[];
  name: "vega";
  sourceExtension?: string;
  type: "diagram";
}

/**
 * Structural type for PlantUML configuration.
 * Avoids a hard dependency on `@plantuml/core` in the core bundle.
 */
export interface PlantUmlConfig {
  dark?: boolean;
}

export interface PlantUmlInstance {
  render: (
    source: string,
    options?: PlantUmlConfig
  ) => Promise<{ svg: string }>;
}

/**
 * Plugin for diagram rendering (PlantUML)
 */
export interface PlantUmlPlugin {
  /**
   * Get the PlantUML instance (initialized with optional config)
   */
  getPlantUml: (config?: PlantUmlConfig) => PlantUmlInstance;
  /**
   * Language identifiers for code blocks (`plantuml`, `puml`)
   */
  language: string | readonly string[];
  name: "plantuml";
  type: "diagram";
}

/**
 * Plugin for math rendering (KaTeX)
 */
export interface MathPlugin {
  /**
   * Get CSS styles for math rendering (injected into head)
   */
  getStyles?: (() => string) | undefined;
  name: "katex";
  /**
   * Get rehype plugin for rendering math
   */
  rehypePlugin: Pluggable;
  /**
   * Get remark plugin for parsing math syntax
   */
  remarkPlugin: Pluggable;
  type: "math";
}

/**
 * Plugin for CJK text handling
 */
export interface CjkPlugin {
  name: "cjk";
  /**
   * @deprecated Use remarkPluginsBefore and remarkPluginsAfter instead
   * All remark plugins (for backwards compatibility)
   */
  remarkPlugins: Pluggable[];
  /**
   * Remark plugins that must run AFTER remarkGfm
   * (e.g., autolink boundary splitting, strikethrough enhancements)
   */
  remarkPluginsAfter: Pluggable[];
  /**
   * Remark plugins that must run BEFORE remarkGfm
   * (e.g., remark-cjk-friendly which modifies emphasis handling)
   */
  remarkPluginsBefore: Pluggable[];
  type: "cjk";
}

/**
 * Structural type for OpenSCAD configuration.
 * Avoids a hard dependency on `@lofcz/streamdown-openscad` in the core bundle.
 */
export interface OpenScadConfig {
  format?: "stl" | "3mf" | "auto";
}

export type OpenScadExportFormat = "stl" | "3mf";

export interface OpenScadRenderResult {
  data: Uint8Array;
  format: OpenScadExportFormat;
  /**
   * Warnings the engine reported for a model that still rendered (an unknown
   * module, function or variable is skipped, so part of the model is missing).
   * Absent with plugin versions that do not collect them.
   */
  warnings?: string[];
}

export interface OpenScadInstance {
  render: (
    source: string,
    options?: OpenScadConfig
  ) => Promise<OpenScadRenderResult>;
}

/**
 * Plugin for 3D model rendering (OpenSCAD)
 */
export interface OpenScadPlugin {
  /**
   * Get the OpenSCAD instance (initialized with optional config)
   */
  getOpenScad: (config?: OpenScadConfig) => OpenScadInstance;
  /**
   * Language identifiers for code blocks (`openscad`, `scad`)
   */
  language: string | readonly string[];
  name: "openscad";
  type: "model";
}

/**
 * Structural type for SMILES configuration.
 * Avoids a hard dependency on `smiles-drawer` in the core bundle.
 */
export interface SmilesConfig {
  compactDrawing?: boolean;
  elementColors?: boolean;
  height?: number;
  theme?: "light" | "dark" | "oldschool" | "auto";
  width?: number;
}

export interface SmilesInstance {
  render: (source: string, options?: SmilesConfig) => Promise<{ svg: string }>;
}

/**
 * Plugin for chemical structure rendering (SMILES)
 */
export interface SmilesPlugin {
  /**
   * Get the SMILES instance (initialized with optional config)
   */
  getSmiles: (config?: SmilesConfig) => SmilesInstance;
  /**
   * Language identifiers for code blocks (`smiles`, `smi`)
   */
  language: string | readonly string[];
  name: "smiles";
  sourceExtension?: string;
  type: "diagram";
}

/**
 * Union type for all plugins
 */
export type StreamdownPlugin =
  | CodeHighlighterPlugin
  | DiagramPlugin
  | PlantUmlPlugin
  | VegaPlugin
  | SmilesPlugin
  | SvgDiagramPlugin
  | MathPlugin
  | CjkPlugin
  | OpenScadPlugin;

export interface CustomRendererProps {
  code: string;
  isIncomplete: boolean;
  language: string;
  /** Raw metastring from the code fence (everything after the language identifier).
   * e.g. ```rust {1} title="foo"  →  meta = '{1} title="foo"'
   * Undefined when no metastring is present. */
  meta?: string | undefined;
}

export interface CustomRenderer {
  component: React.ComponentType<CustomRendererProps>;
  language: string | string[];
}

/**
 * The word fade behind the `animated` prop: `animate` from
 * `@lofcz/streamdown/animate`. Passed as `plugins.animate`, it ships with your bundle
 * and animates from the first render; without it, Streamdown loads it the
 * first time `animated` is set.
 */
export interface AnimationEngine {
  createBlockPlugin: (
    options: AnimateOptions & { timeline: AnimateTimeline; seed?: number }
  ) => AnimatePlugin;
  createTimeline: (options?: CreateAnimateTimelineOptions) => AnimateTimeline;
}

/**
 * Plugin configuration passed to Streamdown
 */
export interface PluginConfig {
  animate?: AnimationEngine | undefined;
  cjk?: CjkPlugin | undefined;
  code?: CodeHighlighterPlugin | undefined;
  /**
   * Extra SVG diagram engines, looked up by fence language after the named
   * mermaid / plantuml / vega / smiles slots.
   */
  diagrams?: SvgDiagramPlugin[] | undefined;
  math?: MathPlugin | undefined;
  mermaid?: DiagramPlugin | undefined;
  openscad?: OpenScadPlugin | undefined;
  plantuml?: PlantUmlPlugin | undefined;
  renderers?: CustomRenderer[] | undefined;
  smiles?: SmilesPlugin | SvgDiagramPlugin | undefined;
  vega?: VegaPlugin | SvgDiagramPlugin | undefined;
}
