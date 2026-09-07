import type { ComponentProps } from "react";
import { toSvgDiagramPlugin } from "../diagram/adapter";
import { DiagramFullscreenButton } from "../diagram/fullscreen-button";
import { usePlantUmlPlugin } from "../plugin-context";
import type { PlantUmlConfig } from "../plugin-types";
import { PlantUml } from ".";

type PlantUmlFullscreenButtonProps = ComponentProps<"button"> & {
  chart: string;
  config?: PlantUmlConfig;
  onFullscreen?: () => void;
  onExit?: () => void;
};

export const PlantUmlFullscreenButton = ({
  chart,
  config,
  onFullscreen,
  onExit,
  className,
  ...props
}: PlantUmlFullscreenButtonProps) => {
  const plantumlPlugin = usePlantUmlPlugin();
  const plugin = plantumlPlugin ? toSvgDiagramPlugin(plantumlPlugin) : null;

  return (
    <DiagramFullscreenButton
      chart={chart}
      className={className}
      config={config}
      DiagramComponent={PlantUml}
      name="plantuml"
      onExit={onExit}
      onFullscreen={onFullscreen}
      plugin={plugin}
      sourceExtension="puml"
      {...props}
    />
  );
};
