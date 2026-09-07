import { useContext, useEffect, useRef, useState } from "react";
import { StreamdownContext } from "../../index";
import { getDownloadFilename } from "../controls";
import { useIcons } from "../icon-context";
import { serializeSvgForDownload, svgToPngBlob } from "../mermaid/utils";
import type { SvgDiagramPlugin } from "../plugin-types";
import { useCn } from "../prefix-context";
import { useTranslations } from "../translations-context";
import { save } from "../utils";
import {
  diagramPluginMissingMessage,
  diagramSourceDownloadLabel,
  diagramSourceFormatLabel,
} from "./labels";
import { buildDiagramRenderOptions } from "./options";

interface DiagramDownloadDropdownProps {
  chart: string;
  children?: React.ReactNode;
  className?: string;
  config?: unknown;
  language?: string;
  name: string;
  onDownload?: (format: "png" | "source" | "svg") => void;
  onError?: (error: Error) => void;
  plugin: SvgDiagramPlugin | null;
  sourceExtension?: string;
}

export const DiagramDownloadDropdown = ({
  chart,
  children,
  className,
  config,
  language,
  name,
  onDownload,
  onError,
  plugin,
  sourceExtension,
}: DiagramDownloadDropdownProps) => {
  const cn = useCn();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAnimating, controls } = useContext(StreamdownContext);
  const icons = useIcons();
  const t = useTranslations();
  const extension = sourceExtension ?? plugin?.sourceExtension ?? "txt";
  const baseFilename = getDownloadFilename(controls, name, "diagram");

  const finishDownload = (format: "png" | "source" | "svg") => {
    setIsOpen(false);
    onDownload?.(format);
  };

  const downloadRendered = async (format: "png" | "svg") => {
    if (!plugin) {
      onError?.(new Error(diagramPluginMissingMessage(name)));
      return;
    }

    const { svg } = await plugin.render(
      chart,
      buildDiagramRenderOptions(config, language)
    );

    if (!svg) {
      onError?.(
        new Error("SVG not found. Please wait for the diagram to render.")
      );
      return;
    }

    const serializedSvg = serializeSvgForDownload(svg);

    if (format === "svg") {
      save(`${baseFilename}.svg`, serializedSvg, "image/svg+xml");
      finishDownload(format);
      return;
    }

    const blob = await svgToPngBlob(serializedSvg);
    save(`${baseFilename}.png`, blob, "image/png");
    finishDownload(format);
  };

  const downloadDiagram = async (format: "png" | "source" | "svg") => {
    try {
      if (format === "source") {
        save(`${baseFilename}.${extension}`, chart, "text/plain");
        finishDownload(format);
        return;
      }

      await downloadRendered(format);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const path = event.composedPath();
      if (dropdownRef.current && !path.includes(dropdownRef.current)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={cn("relative")} ref={dropdownRef}>
      <button
        aria-label={t.downloadDiagram}
        className={cn(
          "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={isAnimating}
        onClick={() => setIsOpen(!isOpen)}
        title={t.downloadDiagram}
        type="button"
      >
        {children ?? <icons.DownloadIcon aria-hidden="true" size={14} />}
      </button>
      {isOpen ? (
        <div
          className={cn(
            "absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg"
          )}
        >
          <button
            aria-label={t.downloadDiagramAsSvg}
            className={cn(
              "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            )}
            onClick={() => downloadDiagram("svg")}
            title={t.downloadDiagramAsSvg}
            type="button"
          >
            {t.mermaidFormatSvg}
          </button>
          <button
            aria-label={t.downloadDiagramAsPng}
            className={cn(
              "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            )}
            onClick={() => downloadDiagram("png")}
            title={t.downloadDiagramAsPng}
            type="button"
          >
            {t.mermaidFormatPng}
          </button>
          <button
            aria-label={diagramSourceDownloadLabel(t, name)}
            className={cn(
              "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
            )}
            onClick={() => downloadDiagram("source")}
            title={diagramSourceDownloadLabel(t, name)}
            type="button"
          >
            {diagramSourceFormatLabel(t, name, extension)}
          </button>
        </div>
      ) : null}
    </div>
  );
};
