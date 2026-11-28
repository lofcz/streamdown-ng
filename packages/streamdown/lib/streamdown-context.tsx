"use client";

import {
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  createContext,
} from "react";
import type { PluggableList } from "unified";
import type { Components } from "./markdown";
import type {
  MermaidConfig,
  OpenScadConfig,
  PlantUmlConfig,
  SmilesConfig,
  ThemeInput,
  VegaConfig,
} from "./plugin-types";
import type { CSVSeparator } from "./table/utils";

export type DownloadControlConfig = boolean | { filename: string };

export type TableCopyFormat = "csv" | "tsv" | "md";

export type CopyControlConfig<TOnCopy = () => void> =
  | boolean
  | {
      onCopy?: TOnCopy | undefined;
      onError?: ((error: Error) => void) | undefined;
    };

export type DiagramControls =
  | boolean
  | {
      download?: DownloadControlConfig | undefined;
      copy?: CopyControlConfig | undefined;
      /** SMILES only: skeletal structures vs compact CH₃ / COOH notation. */
      compact?: boolean | undefined;
      fullscreen?: boolean | undefined;
      panZoom?: boolean | undefined;
    };

export type ControlsConfig =
  | boolean
  | {
      table?:
        | boolean
        | {
            copy?:
              | CopyControlConfig<(format: TableCopyFormat) => void>
              | undefined;
            csvSeparator?: CSVSeparator | undefined;
            download?: DownloadControlConfig | undefined;
            fullscreen?: boolean | undefined;
          }
        | undefined;
      code?:
        | boolean
        | {
            copy?: CopyControlConfig | undefined;
            download?: DownloadControlConfig | undefined;
          }
        | undefined;
      mermaid?: DiagramControls | undefined;
      plantuml?: DiagramControls | undefined;
      smiles?: DiagramControls | undefined;
      vega?: DiagramControls | undefined;
      /**
       * Per-engine controls for extra SVG diagrams registered via
       * `plugins.diagrams`, keyed by plugin `name`.
       */
      diagrams?: Record<string, DiagramControls> | undefined;
      openscad?:
        | boolean
        | {
            download?: DownloadControlConfig | undefined;
            copy?: CopyControlConfig | undefined;
            fullscreen?: boolean | undefined;
          }
        | undefined;
      image?:
        | boolean
        | {
            download?: boolean | undefined;
            fullscreen?: boolean | undefined;
          }
        | undefined;
    };

export interface LinkSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  url: string;
}

export interface LinkSafetyConfig {
  enabled: boolean;
  onLinkCheck?: ((url: string) => Promise<boolean> | boolean) | undefined;
  renderModal?: ((props: LinkSafetyModalProps) => React.ReactNode) | undefined;
}

export interface DiagramErrorComponentProps {
  cause?: unknown;
  chart: string;
  error: string;
  retry: () => void;
}

export interface DiagramOptions {
  config?: unknown;
  errorComponent?: React.ComponentType<DiagramErrorComponentProps> | undefined;
}

export type MermaidErrorComponentProps = DiagramErrorComponentProps;

export interface MermaidOptions {
  config?: MermaidConfig | undefined;
  errorComponent?: React.ComponentType<MermaidErrorComponentProps> | undefined;
}

export type PlantUmlErrorComponentProps = DiagramErrorComponentProps;

export interface PlantUmlOptions {
  config?: PlantUmlConfig | undefined;
  errorComponent?: React.ComponentType<PlantUmlErrorComponentProps> | undefined;
}

export type VegaErrorComponentProps = DiagramErrorComponentProps;

export interface VegaOptions {
  config?: VegaConfig | undefined;
  errorComponent?: React.ComponentType<VegaErrorComponentProps> | undefined;
}

export type SmilesErrorComponentProps = DiagramErrorComponentProps;

export interface SmilesOptions {
  config?: SmilesConfig | undefined;
  errorComponent?: React.ComponentType<SmilesErrorComponentProps> | undefined;
}

export interface OpenScadErrorComponentProps {
  cause?: unknown;
  code: string;
  error: string;
  retry: () => void;
}

export interface OpenScadWarningComponentProps {
  code: string;
  warnings: string[];
}

export interface OpenScadOptions {
  config?: OpenScadConfig | undefined;
  errorComponent?: React.ComponentType<OpenScadErrorComponentProps> | undefined;
  /**
   * Rendered with a model that exported while the engine reported warnings.
   * The model on screen may be incomplete (a skipped unknown module leaves a
   * part out), so a host can explain that or have the source corrected.
   */
  warningComponent?:
    | React.ComponentType<OpenScadWarningComponentProps>
    | undefined;
}

/**
 * Built-in list bullet style presets for nested unordered lists.
 * - `"flat"` — all levels use disc
 * - `"hierarchical"` — disc → circle → square, cycling
 */
export type ListStylePreset = "flat" | "hierarchical";

/**
 * Resolves a custom-callout icon name (`>>> (heart)[Title]`) to a node.
 * Consumer supplies e.g. lucide's DynamicIcon; return `null`/`undefined`
 * for a blank placeholder while the icon chunk loads.
 */
export type CalloutIconResolver = (name: string) => React.ReactNode;

/**
 * Computes the inline style (background tint + accent border/title color)
 * for a custom callout from its optional `{color}` value. Default is a
 * neutral `color-mix()` tint (see components.tsx).
 */
export type CalloutStyleResolver = (color?: string) => CSSProperties;

/**
 * Props passed to the component used for a horizontal-scroll region
 * (code-block body, table inner scroll). `scrollRef` must be attached to the
 * actual scrolling viewport (callback refs are used so async scrollbar init,
 * e.g. OverlayScrollbars, can assign the viewport after first paint).
 */
export type ScrollableProps = ComponentProps<"div"> & {
  scrollRef?: React.Ref<HTMLDivElement>;
};

/**
 * Component used to render a horizontal-scroll region (code-block body,
 * table inner scroll). Defaults to a plain `<div>`; override to plug in a
 * custom scrollbar implementation (e.g. OverlayScrollbars) declaratively,
 * without DOM observers or per-element wiring.
 */
export type ScrollableComponent = ComponentType<ScrollableProps>;

/** DOM node for Streamdown overlays, or a function returning one. Defaults to `document.body`. */
export type PortalTarget = HTMLElement | null | (() => HTMLElement | null);

// Combined context for better performance - reduces React tree depth from 5 nested providers to 1
export interface StreamdownContextType {
  /** Icon resolver for custom callouts (`>>> (icon)[Title]{color}`). */
  calloutIcon?: CalloutIconResolver | undefined;
  /** Style resolver for custom callouts (background tint + accent). */
  calloutStyle?: CalloutStyleResolver | undefined;
  /** Max height for code blocks (px number or CSS length). `0` / `Infinity` disables. @default 400 */
  codeBlockMaxHeight?: number | string | undefined;
  /** Fence languages rendered verbatim without highlighting or controls. */
  codeBlockRawLanguages?: string[] | undefined;
  /** Merged components/plugins so custom renderers (e.g. callout body) can re-parse nested markdown identically to the outer pass. */
  components?: Components | undefined;
  controls: ControlsConfig;
  /** Per-engine options for extra SVG diagrams, keyed by plugin `name`. */
  diagrams?: Record<string, DiagramOptions> | undefined;
  isAnimating: boolean;
  /** Show line numbers in code blocks. @default true */
  lineNumbers: boolean;
  linkSafety?: LinkSafetyConfig | undefined;
  /** Bullet style cycling for nested unordered lists. @default "hierarchical" */
  listStyle: ListStylePreset;
  mermaid?: MermaidOptions | undefined;
  mode: "static" | "streaming";
  openscad?: OpenScadOptions | undefined;
  plantuml?: PlantUmlOptions | undefined;
  /** Overlay portal target for fullscreen and the built-in link safety modal. */
  portal?: PortalTarget | undefined;
  rehypePlugins?: PluggableList | undefined;
  remarkPlugins?: PluggableList | undefined;
  /** Component used for horizontal-scroll regions (code body, table). @default plain div */
  scrollable?: ScrollableComponent | undefined;
  shikiTheme: [ThemeInput, ThemeInput];
  smiles?: SmilesOptions | undefined;
  /** Max height for tables (px number or CSS length). `0` / `Infinity` disables. @default 300 */
  tableMaxHeight?: number | string | undefined;
  vega?: VegaOptions | undefined;
}

const defaultShikiTheme: [ThemeInput, ThemeInput] = [
  "github-light",
  "github-dark",
];

const defaultLinkSafetyConfig: LinkSafetyConfig = {
  enabled: true,
};

export const defaultStreamdownContext: StreamdownContextType = {
  codeBlockMaxHeight: 400,
  shikiTheme: defaultShikiTheme,
  controls: true,
  isAnimating: false,
  lineNumbers: true,
  listStyle: "hierarchical",
  mode: "streaming",
  mermaid: undefined,
  openscad: undefined,
  plantuml: undefined,
  smiles: undefined,
  vega: undefined,
  diagrams: undefined,
  linkSafety: defaultLinkSafetyConfig,
  portal: undefined,
  tableMaxHeight: 300,
};

export const StreamdownContext = createContext<StreamdownContextType>(
  defaultStreamdownContext
);
