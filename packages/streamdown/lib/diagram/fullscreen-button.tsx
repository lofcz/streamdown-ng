import {
  type ComponentProps,
  type ComponentType,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { StreamdownContext } from "../../index";
import { useIcons } from "../icon-context";
import type { SvgDiagramPlugin } from "../plugin-types";
import { resolvePortalTarget } from "../portal";
import { useCn } from "../prefix-context";
import { lockBodyScroll, unlockBodyScroll } from "../scroll-lock";
import { useTranslations } from "../translations-context";
import { Diagram } from ".";
import { shouldShowDiagramControl } from "./controls";
import { DiagramDownloadDropdown } from "./download-button";

interface DiagramViewProps {
  chart: string;
  className?: string;
  config?: unknown;
  fullscreen?: boolean;
  language?: string;
  showControls?: boolean;
}

type DiagramFullscreenButtonProps = ComponentProps<"button"> & {
  DiagramComponent?: ComponentType<DiagramViewProps>;
  chart: string;
  config?: unknown;
  language?: string;
  name: string;
  onExit?: () => void;
  onFullscreen?: () => void;
  plugin: SvgDiagramPlugin | null;
  sourceExtension?: string;
};

export const DiagramFullscreenButton = ({
  DiagramComponent,
  chart,
  className,
  config,
  language,
  name,
  onExit,
  onFullscreen,
  plugin,
  sourceExtension,
  ...props
}: DiagramFullscreenButtonProps) => {
  const { Maximize2Icon, XIcon } = useIcons();
  const cn = useCn();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const {
    isAnimating,
    controls: controlsConfig,
    portal,
  } = useContext(StreamdownContext);
  const t = useTranslations();
  const showPanZoomControls = shouldShowDiagramControl(
    controlsConfig,
    name,
    "panZoom"
  );
  const showDownload = shouldShowDiagramControl(
    controlsConfig,
    name,
    "download"
  );

  const handleToggle = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    if (isFullscreen) {
      lockBodyScroll();

      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsFullscreen(false);
        }
      };

      document.addEventListener("keydown", handleEsc);
      return () => {
        document.removeEventListener("keydown", handleEsc);
        unlockBodyScroll();
      };
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      onFullscreen?.();
    } else if (onExit) {
      onExit();
    }
  }, [isFullscreen, onFullscreen, onExit]);

  return (
    <>
      <button
        className={cn(
          "cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={isAnimating}
        onClick={handleToggle}
        title={t.viewFullscreen}
        type="button"
        {...props}
        aria-label={t.viewFullscreen}
      >
        <Maximize2Icon aria-hidden="true" size={14} />
      </button>

      {isFullscreen
        ? createPortal(
            // biome-ignore lint/a11y/noNoninteractiveElementInteractions: "dialog overlay needs click-to-dismiss"
            <div
              aria-label={t.viewFullscreen}
              aria-modal="true"
              className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
              )}
              data-streamdown={`${name}-fullscreen`}
              onClick={handleToggle}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleToggle();
                }
              }}
              role="dialog"
            >
              {/* biome-ignore lint/a11y/noStaticElementInteractions: "div with role=presentation is used for event propagation control" */}
              <div
                className={cn(
                  "absolute top-4 right-4 z-10 flex items-center gap-1"
                )}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="presentation"
              >
                {showDownload ? (
                  <DiagramDownloadDropdown
                    chart={chart}
                    config={config}
                    language={language}
                    name={name}
                    plugin={plugin}
                    sourceExtension={sourceExtension}
                  />
                ) : null}
                <button
                  aria-label={t.exitFullscreen}
                  className={cn(
                    "rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                  )}
                  onClick={handleToggle}
                  title={t.exitFullscreen}
                  type="button"
                >
                  <XIcon aria-hidden="true" size={20} />
                </button>
              </div>
              {/* biome-ignore lint/a11y/noStaticElementInteractions: "div with role=presentation is used for event propagation control" */}
              <div
                className={cn("flex size-full items-center justify-center p-4")}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="presentation"
              >
                {DiagramComponent ? (
                  <DiagramComponent
                    chart={chart}
                    className={cn("size-full [&_svg]:h-auto [&_svg]:w-auto")}
                    config={config}
                    fullscreen={true}
                    language={language}
                    showControls={showPanZoomControls}
                  />
                ) : (
                  <Diagram
                    chart={chart}
                    className={cn("size-full [&_svg]:h-auto [&_svg]:w-auto")}
                    config={config}
                    fallbackName={name}
                    fullscreen={true}
                    language={language}
                    plugin={plugin}
                    showControls={showPanZoomControls}
                  />
                )}
              </div>
            </div>,
            resolvePortalTarget(portal)
          )
        : null}
    </>
  );
};
