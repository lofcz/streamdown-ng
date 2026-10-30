import { describe, expect, it, vi } from "vitest";
import { createTikzPlugin } from "../lib/tikz";

const image = {
  src: "data:image/svg+xml;base64,PHN2Zy8+",
  width: 100,
  height: 50,
};
describe("TikZ plugin", () => {
  it("defers incomplete fences, preserves TeX downloads and shares a render with fullscreen", async () => {
    const render = vi.fn(async () => image);
    const plugin = createTikzPlugin({ render });
    expect(plugin.waitForClosedFence).toBe(true);
    expect(plugin.sourceExtension).toBe("tex");
    const [a, b] = await Promise.all([
      plugin.render("source"),
      plugin.render("source"),
    ]);
    expect(a).toEqual(b);
    expect(render).toHaveBeenCalledTimes(1);
    expect(a.svg).toContain("<image");
    expect(a.svg).toContain(image.src);
  });
  it("does not inject renderer markup or attribute-breaking URLs", async () => {
    const plugin = createTikzPlugin({
      render: async () => ({ ...image, src: '<svg onload="alert(1)"/>' }),
    });
    await expect(plugin.render("source")).rejects.toThrow("Invalid TikZ");
  });
  it("rejects invalid dimensions and permits retry after a failure", async () => {
    const render = vi
      .fn()
      .mockResolvedValueOnce({ ...image, width: Number.NaN })
      .mockResolvedValue(image);
    const plugin = createTikzPlugin({ render });
    await expect(plugin.render("source")).rejects.toThrow();
    await expect(plugin.render("source")).resolves.toHaveProperty("svg");
  });
  it("rejects empty and oversized source before calling the renderer", async () => {
    const render = vi.fn();
    const plugin = createTikzPlugin({ render });
    await expect(plugin.render(" ")).rejects.toThrow();
    await expect(plugin.render("x".repeat(12_001))).rejects.toThrow();
    expect(render).not.toHaveBeenCalled();
  });
});
