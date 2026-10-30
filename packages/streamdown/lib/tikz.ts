import type { SvgDiagramPlugin } from "./plugin-types";

export interface TikzImage {
  height: number;
  /** Base64 SVG image URL returned by a trusted TeX/WASM renderer. */
  src: string;
  width: number;
}

export interface TikzPluginOptions {
  /** Compile standard TikZ, e.g. with jmckalex/mp-tikz-wasm on your server. */
  render: (source: string) => Promise<TikzImage>;
}

const SVG_IMAGE = /^data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+$/;

/** Render TikZ using the shared diagram controls, without bundling TeX. */
export function createTikzPlugin(options: TikzPluginOptions): SvgDiagramPlugin {
  const cache = new Map<string, Promise<{ svg: string }>>();
  return {
    name: "tikz",
    language: "tikz",
    sourceExtension: "tex",
    type: "diagram",
    waitForClosedFence: true,
    render(source) {
      if (!source.trim() || source.length > 12_000) {
        return Promise.reject(
          new Error("TikZ source must contain 1–12,000 characters.")
        );
      }
      const previous = cache.get(source);
      if (previous) {
        return previous;
      }
      const result = Promise.resolve()
        .then(() => options.render(source))
        .then(({ src, width, height }) => {
          if (
            !(
              SVG_IMAGE.test(src) &&
              Number.isFinite(width) &&
              Number.isFinite(height) &&
              width > 0 &&
              height > 0
            )
          ) {
            throw new Error("Invalid TikZ renderer image.");
          }
          // TeX specials may contain arbitrary SVG. An image document keeps it
          // inert and isolates glyph IDs across diagrams, including fullscreen.
          return {
            svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image width="${width}" height="${height}" href="${src}"/></svg>`,
          };
        })
        .catch((error: unknown) => {
          cache.delete(source);
          throw error;
        });
      if (cache.size >= 8) {
        cache.delete(cache.keys().next().value as string);
      }
      cache.set(source, result);
      return result;
    },
  };
}
