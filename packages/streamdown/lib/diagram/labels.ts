import type { StreamdownTranslations } from "../translations-context";

export type DiagramLabelKind = "chart" | "error" | "missing" | "failed";

const GENERIC_LABELS: Record<DiagramLabelKind, keyof StreamdownTranslations> = {
  chart: "diagramChart",
  error: "diagramErrorLabel",
  missing: "diagramPluginMissing",
  failed: "diagramRenderFailed",
};

const NAMED_LABELS: Record<
  string,
  Record<DiagramLabelKind, keyof StreamdownTranslations>
> = {
  mermaid: {
    chart: "mermaidChart",
    error: "mermaidErrorLabel",
    missing: "mermaidPluginMissing",
    failed: "mermaidRenderFailed",
  },
  plantuml: {
    chart: "plantumlChart",
    error: "plantumlErrorLabel",
    missing: "plantumlPluginMissing",
    failed: "plantumlRenderFailed",
  },
  vega: {
    chart: "vegaChart",
    error: "vegaErrorLabel",
    missing: "vegaPluginMissing",
    failed: "vegaRenderFailed",
  },
  smiles: {
    chart: "smilesChart",
    error: "smilesErrorLabel",
    missing: "smilesPluginMissing",
    failed: "smilesRenderFailed",
  },
};

const SOURCE_FORMAT: Record<string, keyof StreamdownTranslations> = {
  mermaid: "mermaidFormatMmd",
  plantuml: "plantumlFormatPuml",
  vega: "vegaFormatJson",
  smiles: "smilesFormatSmi",
};

const SOURCE_DOWNLOAD: Record<string, keyof StreamdownTranslations> = {
  mermaid: "downloadDiagramAsMmd",
  plantuml: "downloadDiagramAsPuml",
  vega: "downloadDiagramAsJson",
  smiles: "downloadDiagramAsSmi",
};

export const diagramLabel = (
  t: StreamdownTranslations,
  name: string,
  kind: DiagramLabelKind
): string => {
  const keys = NAMED_LABELS[name] ?? GENERIC_LABELS;
  return t[keys[kind]];
};

export const diagramSourceFormatLabel = (
  t: StreamdownTranslations,
  name: string,
  sourceExtension: string
): string => {
  const key = SOURCE_FORMAT[name];
  if (key) {
    return t[key];
  }
  return sourceExtension.toUpperCase() || t.diagramFormatSource;
};

export const diagramSourceDownloadLabel = (
  t: StreamdownTranslations,
  name: string
): string => {
  const key = SOURCE_DOWNLOAD[name];
  if (key) {
    return t[key];
  }
  return t.downloadDiagramAsSource;
};

export const diagramPluginMissingMessage = (name: string): string => {
  if (name === "mermaid") {
    return "Mermaid plugin not available";
  }
  if (name === "plantuml") {
    return "PlantUML plugin not available";
  }
  if (name === "vega") {
    return "Vega plugin not available";
  }
  if (name === "smiles") {
    return "SMILES plugin not available";
  }
  return "Diagram plugin not available";
};
