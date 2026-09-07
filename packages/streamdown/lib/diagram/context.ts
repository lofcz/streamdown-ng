import type {
  DiagramOptions,
  StreamdownContextType,
} from "../streamdown-context";

export const getDiagramOptions = (
  context: StreamdownContextType,
  name: string
): DiagramOptions | undefined => {
  if (name === "mermaid") {
    return context.mermaid;
  }
  if (name === "plantuml") {
    return context.plantuml;
  }
  if (name === "vega") {
    return context.vega;
  }
  if (name === "smiles") {
    return context.smiles;
  }
  return context.diagrams?.[name];
};
