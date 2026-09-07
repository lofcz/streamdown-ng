import { toSvgDiagramPlugin } from "../diagram/adapter";
import { DiagramDownloadDropdown } from "../diagram/download-button";
import { useMermaidPlugin } from "../plugin-context";
import type { MermaidConfig } from "../plugin-types";

interface MermaidDownloadDropdownProps {
  chart: string;
  children?: React.ReactNode;
  className?: string;
  config?: MermaidConfig;
  onDownload?: (format: "mmd" | "png" | "svg") => void;
  onError?: (error: Error) => void;
}

export const MermaidDownloadDropdown = ({
  onDownload,
  ...props
}: MermaidDownloadDropdownProps) => {
  const mermaidPlugin = useMermaidPlugin();
  const plugin = mermaidPlugin ? toSvgDiagramPlugin(mermaidPlugin) : null;

  return (
    <DiagramDownloadDropdown
      {...props}
      name="mermaid"
      onDownload={
        onDownload
          ? (format) => onDownload(format === "source" ? "mmd" : format)
          : undefined
      }
      plugin={plugin}
      sourceExtension="mmd"
    />
  );
};
