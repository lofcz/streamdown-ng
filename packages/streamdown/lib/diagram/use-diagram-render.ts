import { useCallback, useEffect, useRef, useState } from "react";
import { getMermaidSvgSize, normalizeMermaidInlineSvg } from "../mermaid/utils";
import type { SvgDiagramPlugin } from "../plugin-types";
import { buildDiagramRenderOptions } from "./options";

interface RenderRequest {
  chart: string;
  config?: unknown;
  failedMessage: string;
  fullscreen: boolean;
  language?: string;
  plugin: SvgDiagramPlugin;
}

const sameRenderer = (
  current: RenderRequest | null,
  request: RenderRequest
): boolean =>
  Boolean(
    current &&
      current.plugin === request.plugin &&
      current.config === request.config &&
      current.fullscreen === request.fullscreen &&
      current.language === request.language
  );

export const useDiagramRender = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [svgContent, setSvgContent] = useState("");
  const [svgSize, setSvgSize] = useState<{
    height: number;
    width: number;
  } | null>(null);
  const latest = useRef<RenderRequest | null>(null);
  const mounted = useRef(false);
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      latest.current = null;
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
        inFlight.current = false;
      }
    };
  }, []);

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: single-flight state machine keeps completion, cancellation, and cooldown together
  const pump = useCallback(async function renderLatest() {
    const request = latest.current;
    if (!mounted.current || inFlight.current || !request) {
      return;
    }
    inFlight.current = true;
    setError(null);
    setIsLoading(true);
    const started = performance.now();
    try {
      const { svg } = await request.plugin.render(
        request.chart,
        buildDiagramRenderOptions(request.config, request.language)
      );
      const current = latest.current;
      // An older chart is a useful preview, but never commit a render made
      // with a replaced plugin/configuration or the wrong fullscreen sizing.
      if (mounted.current && sameRenderer(current, request)) {
        setSvgContent(
          request.fullscreen ? svg : normalizeMermaidInlineSvg(svg)
        );
        setSvgSize(getMermaidSvgSize(svg));
        setError(null);
      }
    } catch (err) {
      if (mounted.current && latest.current === request) {
        setError(err instanceof Error ? err.message : request.failedMessage);
      }
    }
    if (!mounted.current) {
      inFlight.current = false;
      return;
    }
    setIsLoading(false);
    // Mermaid can spend significant CPU time before throwing too. Other
    // engines may be remote, so their network latency is not a CPU budget.
    timer.current = setTimeout(
      () => {
        timer.current = null;
        inFlight.current = false;
        if (latest.current !== request) {
          renderLatest();
        }
      },
      request.plugin.name === "mermaid"
        ? Math.max(0, performance.now() - started)
        : 0
    );
  }, []);

  const requestRender = useCallback(
    (request: RenderRequest | null) => {
      latest.current = request;
      if (request) {
        pump();
      } else {
        setIsLoading(false);
      }
    },
    [pump]
  );

  return { error, setError, isLoading, svgContent, svgSize, requestRender };
};
