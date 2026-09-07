import type { ControlsConfig } from "../streamdown-context";

export type DiagramControlType =
  | "download"
  | "copy"
  | "compact"
  | "fullscreen"
  | "panZoom";

const lookupDiagramControls = (config: ControlsConfig, name: string) => {
  if (typeof config === "boolean") {
    return config;
  }

  if (name !== "diagrams" && name in config) {
    return config[name as keyof typeof config];
  }

  return config.diagrams?.[name];
};

export const shouldShowDiagramControls = (
  config: ControlsConfig,
  name: string
): boolean => {
  if (typeof config === "boolean") {
    return config;
  }
  return lookupDiagramControls(config, name) !== false;
};

export const shouldShowDiagramControl = (
  config: ControlsConfig,
  name: string,
  controlType: DiagramControlType
): boolean => {
  if (typeof config === "boolean") {
    return config;
  }

  const typeConfig = lookupDiagramControls(config, name);

  if (typeConfig === false) {
    return false;
  }

  if (typeConfig === true || typeConfig === undefined) {
    return true;
  }

  if (typeof typeConfig === "object" && typeConfig !== null) {
    return (typeConfig as Record<string, unknown>)[controlType] !== false;
  }

  return true;
};
