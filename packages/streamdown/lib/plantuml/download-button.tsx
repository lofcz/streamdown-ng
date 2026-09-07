import { toSvgDiagramPlugin } from "../diagram/adapter";
import { DiagramDownloadDropdown } from "../diagram/download-button";
import { usePlantUmlPlugin } from "../plugin-context";
import type { PlantUmlConfig } from "../plugin-types";

interface PlantUmlDownloadDropdownProps {
  chart: string;
  children?: React.ReactNode;
  className?: string;
  config?: PlantUmlConfig;
  onDownload?: (format: "puml" | "png" | "svg") => void;
  onError?: (error: Error) => void;
}

export const PlantUmlDownloadDropdown = ({
  onDownload,
  ...props
}: PlantUmlDownloadDropdownProps) => {
  const plantumlPlugin = usePlantUmlPlugin();
  const plugin = plantumlPlugin ? toSvgDiagramPlugin(plantumlPlugin) : null;

  return (
    <DiagramDownloadDropdown
      {...props}
      name="plantuml"
      onDownload={
        onDownload
          ? (format) => onDownload(format === "source" ? "puml" : format)
          : undefined
      }
      plugin={plugin}
      sourceExtension="puml"
    />
  );
};
