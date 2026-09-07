import { useContext, useEffect, useState } from "react";
import { useDeferredRender } from "../../hooks/use-deferred-render";
import { StreamdownContext } from "../../index";
import { PanZoom } from "../mermaid/pan-zoom";
import { getMermaidSvgSize, normalizeMermaidInlineSvg } from "../mermaid/utils";
import type { SvgDiagramPlugin } from "../plugin-types";
import { useCn } from "../prefix-context";
import { useTranslations } from "../translations-context";
import { getDiagramOptions } from "./context";
import { diagramLabel } from "./labels";
import { buildDiagramRenderOptions } from "./options";

interface DiagramProps {
  chart: string;
  className?: string;
  config?: unknown;
  fallbackName?: string;
  fullscreen?: boolean;
  language?: string;
  plugin: SvgDiagramPlugin | null;
  showControls?: boolean;
}

export const Diagram = ({
  chart,
  className,
  config,
  fallbackName,
  fullscreen = false,
  language,
  plugin,
  showControls = true,
}: DiagramProps) => {
  const cn = useCn();
  const t = useTranslations();
  const name = plugin?.name ?? fallbackName ?? "diagram";
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [svgContent, setSvgContent] = useState<string>("");
  const [svgSize, setSvgSize] = useState<{
    height: number;
    width: number;
  } | null>(null);
  const [lastValidSvg, setLastValidSvg] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const streamdownContext = useContext(StreamdownContext);
  const diagramOptions = getDiagramOptions(streamdownContext, name);
  const ErrorComponent = diagramOptions?.errorComponent;

  const { shouldRender, containerRef } = useDeferredRender({
    immediate: fullscreen,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: "Required for diagram engines"
  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    if (!plugin) {
      setError(diagramLabel(t, name, "missing"));
      return;
    }

    const renderChart = async () => {
      try {
        setError(null);
        setIsLoading(true);

        const { svg } = await plugin.render(
          chart,
          buildDiagramRenderOptions(config, language)
        );
        const size = getMermaidSvgSize(svg);
        const normalizedSvg = fullscreen ? svg : normalizeMermaidInlineSvg(svg);

        setSvgContent(normalizedSvg);
        setSvgSize(size);
        setLastValidSvg(normalizedSvg);
      } catch (err) {
        if (!(lastValidSvg || svgContent)) {
          setError(
            err instanceof Error ? err.message : diagramLabel(t, name, "failed")
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    renderChart();
  }, [chart, config, language, retryCount, shouldRender, plugin]);

  if (!(shouldRender || svgContent || lastValidSvg)) {
    return (
      <div className={cn("my-4 min-h-[200px]", className)} ref={containerRef} />
    );
  }

  if (isLoading && !svgContent && !lastValidSvg) {
    return (
      <div
        className={cn("my-4 flex justify-center p-4", className)}
        ref={containerRef}
      >
        <div
          className={cn("flex items-center space-x-2 text-muted-foreground")}
        >
          <div
            className={cn(
              "h-4 w-4 animate-spin rounded-full border-current border-b-2"
            )}
          />
          <span className={cn("text-sm")}>{t.diagramLoading}</span>
        </div>
      </div>
    );
  }

  if (error && !svgContent && !lastValidSvg) {
    const retry = () => setRetryCount((count) => count + 1);

    if (ErrorComponent) {
      return (
        <div ref={containerRef}>
          <ErrorComponent chart={chart} error={error} retry={retry} />
        </div>
      );
    }

    return (
      <div
        className={cn("rounded-md bg-red-50 p-4", className)}
        ref={containerRef}
      >
        <p className={cn("font-mono text-red-700 text-sm")}>
          {diagramLabel(t, name, "error")}: {error}
        </p>
        <details className={cn("mt-2")}>
          <summary className={cn("cursor-pointer text-red-600 text-xs")}>
            {t.showCode}
          </summary>
          <pre
            className={cn(
              "mt-2 overflow-x-auto rounded bg-red-100 p-2 text-red-800 text-xs"
            )}
          >
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  const displaySvg = svgContent || lastValidSvg;

  return (
    <div
      className={cn(
        fullscreen ? "size-full" : "max-h-[min(70vh,40rem)] w-full",
        className
      )}
      data-streamdown={name}
      ref={containerRef}
    >
      <PanZoom
        className={cn(
          fullscreen
            ? "size-full overflow-hidden"
            : "max-h-[min(70vh,40rem)] overflow-hidden",
          className
        )}
        contentSize={svgSize}
        fitKey={chart}
        fullscreen={fullscreen}
        isAutoFit={true}
        maxZoom={3}
        minZoom={0.1}
        showControls={showControls}
        zoomStep={0.1}
      >
        <div
          aria-label={diagramLabel(t, name, "chart")}
          className={cn(
            "flex justify-center",
            fullscreen ? "size-full items-center" : null
          )}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required for diagram SVG"
          dangerouslySetInnerHTML={{ __html: displaySvg }}
          role="img"
        />
      </PanZoom>
    </div>
  );
};
