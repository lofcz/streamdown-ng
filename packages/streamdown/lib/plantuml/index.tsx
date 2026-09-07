import { Diagram } from "../diagram";
import { toSvgDiagramPlugin } from "../diagram/adapter";
import { usePlantUmlPlugin } from "../plugin-context";

interface PlantUmlProps {
  chart: string;
  className?: string;
  config?: unknown;
  fullscreen?: boolean;
  language?: string;
  showControls?: boolean;
}

export const PlantUml = ({
  chart,
  className,
  config,
  fullscreen = false,
  language,
  showControls = true,
}: PlantUmlProps) => {
  const plantumlPlugin = usePlantUmlPlugin();
  const plugin = plantumlPlugin ? toSvgDiagramPlugin(plantumlPlugin) : null;

  return (
    <Diagram
      chart={chart}
      className={className}
      config={config}
      fallbackName="plantuml"
      fullscreen={fullscreen}
      language={language}
      plugin={plugin}
      showControls={showControls}
    />
  );
};
