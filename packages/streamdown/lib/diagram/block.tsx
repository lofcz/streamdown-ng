import { useContext, useState } from "react";
import { CodeBlockCopyButton } from "../code-block/copy-button";
import { getCopyCallbacks } from "../controls";
import type { SvgDiagramPlugin } from "../plugin-types";
import { useCn } from "../prefix-context";
import {
  defaultSmilesCompactDrawing,
  readConfiguredCompactDrawing,
  withSmilesCompactDrawing,
} from "../smiles/compact";
import { SmilesNotationToggle } from "../smiles/notation-toggle";
import { StreamdownContext } from "../streamdown-context";
import { useTranslations } from "../translations-context";
import { Diagram } from ".";
import { getDiagramOptions } from "./context";
import {
  shouldShowDiagramControl,
  shouldShowDiagramControls,
} from "./controls";
import { DiagramDownloadDropdown } from "./download-button";
import { DiagramFullscreenButton } from "./fullscreen-button";

interface DiagramCodeBlockProps {
  className?: string;
  code: string;
  isBlockIncomplete?: boolean;
  language: string;
  plugin: SvgDiagramPlugin;
}

export const DiagramCodeBlock = ({
  className,
  code,
  isBlockIncomplete,
  language,
  plugin,
}: DiagramCodeBlockProps) => {
  const cn = useCn();
  const t = useTranslations();
  const streamdownContext = useContext(StreamdownContext);
  const { controls: controlsConfig } = streamdownContext;
  const diagramName = plugin.name;
  const diagramOptions = getDiagramOptions(streamdownContext, diagramName);
  const isSmiles = diagramName === "smiles";
  const configuredCompact = readConfiguredCompactDrawing(
    diagramOptions?.config
  );
  const [notation, setNotation] = useState<{
    code: string;
    override?: boolean;
  }>({ code });
  const compactOverride =
    notation.code === code ? notation.override : undefined;
  const compactDrawing =
    compactOverride ?? configuredCompact ?? defaultSmilesCompactDrawing(code);
  const diagramConfig = isSmiles
    ? withSmilesCompactDrawing(diagramOptions?.config, compactDrawing)
    : diagramOptions?.config;

  const showDownload = shouldShowDiagramControl(
    controlsConfig,
    diagramName,
    "download"
  );
  const showCopy = shouldShowDiagramControl(
    controlsConfig,
    diagramName,
    "copy"
  );
  const showFullscreen = shouldShowDiagramControl(
    controlsConfig,
    diagramName,
    "fullscreen"
  );
  const showPanZoomControls = shouldShowDiagramControl(
    controlsConfig,
    diagramName,
    "panZoom"
  );
  const showCompact =
    isSmiles &&
    shouldShowDiagramControl(controlsConfig, diagramName, "compact");
  const showDiagramControls =
    shouldShowDiagramControls(controlsConfig, diagramName) &&
    (showDownload || showCopy || showFullscreen || showCompact);

  return (
    <div
      className={cn(
        "group relative my-4 flex w-full flex-col gap-2 rounded-xl border border-border bg-sidebar p-2",
        className
      )}
      data-incomplete={isBlockIncomplete || undefined}
      data-streamdown={`${diagramName}-block`}
    >
      <div
        className={cn("flex h-8 items-center text-muted-foreground text-xs")}
      >
        <span className={cn("ml-1 font-mono lowercase")}>{language}</span>
      </div>
      {showDiagramControls ? (
        <div
          className={cn(
            "pointer-events-none sticky top-2 z-10 -mt-10 flex h-8 items-center justify-end"
          )}
        >
          <div
            className={cn(
              "pointer-events-auto flex shrink-0 items-center gap-2 rounded-md border border-sidebar bg-sidebar/80 px-1.5 py-1 supports-[backdrop-filter]:bg-sidebar/70 supports-[backdrop-filter]:backdrop-blur"
            )}
            data-streamdown={`${diagramName}-block-actions`}
          >
            {showCompact ? (
              <SmilesNotationToggle
                compact={compactDrawing}
                onToggle={() =>
                  setNotation({ code, override: !compactDrawing })
                }
              />
            ) : null}
            {showDownload ? (
              <DiagramDownloadDropdown
                chart={code}
                config={diagramConfig}
                language={language}
                name={diagramName}
                plugin={plugin}
                sourceExtension={plugin.sourceExtension}
              />
            ) : null}
            {showCopy ? (
              <CodeBlockCopyButton
                code={code}
                label={t.copyDiagram}
                {...getCopyCallbacks(controlsConfig, diagramName)}
              />
            ) : null}
            {showFullscreen ? (
              <DiagramFullscreenButton
                chart={code}
                config={diagramConfig}
                language={language}
                name={diagramName}
                plugin={plugin}
                sourceExtension={plugin.sourceExtension}
              />
            ) : null}
          </div>
        </div>
      ) : null}
      <div
        className={cn(
          "overflow-hidden rounded-md border border-border bg-background"
        )}
      >
        <Diagram
          chart={code}
          config={diagramConfig}
          fallbackName={diagramName}
          language={language}
          plugin={plugin}
          showControls={showPanZoomControls}
        />
      </div>
    </div>
  );
};
