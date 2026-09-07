import type { ComponentProps } from "react";
import { toSvgDiagramPlugin } from "../diagram/adapter";
import { DiagramFullscreenButton } from "../diagram/fullscreen-button";
import { useMermaidPlugin } from "../plugin-context";
import type { MermaidConfig } from "../plugin-types";
import { Mermaid } from ".";

type MermaidFullscreenButtonProps = ComponentProps<"button"> & {
  chart: string;
  config?: MermaidConfig;
  onFullscreen?: () => void;
  onExit?: () => void;
};

export const MermaidFullscreenButton = ({
  chart,
  config,
  onFullscreen,
  onExit,
  className,
  ...props
}: MermaidFullscreenButtonProps) => {
  const mermaidPlugin = useMermaidPlugin();
  const plugin = mermaidPlugin ? toSvgDiagramPlugin(mermaidPlugin) : null;

  return (
    <DiagramFullscreenButton
      chart={chart}
      className={className}
      config={config}
      DiagramComponent={Mermaid}
      name="mermaid"
      onExit={onExit}
      onFullscreen={onFullscreen}
      plugin={plugin}
      sourceExtension="mmd"
      {...props}
    />
  );
};
