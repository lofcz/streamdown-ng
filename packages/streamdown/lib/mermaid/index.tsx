import { Diagram } from "../diagram";
import { toSvgDiagramPlugin } from "../diagram/adapter";
import { useMermaidPlugin } from "../plugin-context";

interface MermaidProps {
  chart: string;
  className?: string;
  config?: unknown;
  fullscreen?: boolean;
  language?: string;
  showControls?: boolean;
}

export const Mermaid = ({
  chart,
  className,
  config,
  fullscreen = false,
  language,
  showControls = true,
}: MermaidProps) => {
  const mermaidPlugin = useMermaidPlugin();
  const plugin = mermaidPlugin ? toSvgDiagramPlugin(mermaidPlugin) : null;

  return (
    <Diagram
      chart={chart}
      className={className}
      config={config}
      fallbackName="mermaid"
      fullscreen={fullscreen}
      language={language}
      plugin={plugin}
      showControls={showControls}
    />
  );
};
