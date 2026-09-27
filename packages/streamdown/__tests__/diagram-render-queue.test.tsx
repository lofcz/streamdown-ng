import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDiagramRender } from "../lib/diagram/use-diagram-render";
import type { SvgDiagramPlugin } from "../lib/plugin-types";

const pending = () => {
  let resolve!: (value: { svg: string }) => void;
  const promise = new Promise<{ svg: string }>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const plugin = (render: SvgDiagramPlugin["render"]): SvgDiagramPlugin => ({
  name: "test",
  type: "diagram",
  language: "test",
  render,
});
const request = (engine: SvgDiagramPlugin, fullscreen = false) => ({
  chart: "chart",
  plugin: engine,
  fullscreen,
  failedMessage: "failed",
});
afterEach(() => vi.useRealTimers());

describe("diagram render queue", () => {
  it("uses the latest plugin and fullscreen mode after an in-flight render", async () => {
    vi.useFakeTimers();
    const first = pending();
    const oldEngine = plugin(vi.fn(() => first.promise));
    const newEngine = plugin(
      vi.fn(async () => ({
        svg: '<svg width="20" height="10"><text>new</text></svg>',
      }))
    );
    const { result } = renderHook(useDiagramRender);
    act(() => result.current.requestRender(request(oldEngine)));
    act(() => result.current.requestRender(request(newEngine, true)));
    await act(async () => {
      first.resolve({ svg: "<svg><text>old</text></svg>" });
      await first.promise;
    });
    expect(result.current.svgContent).toBe("");
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(newEngine.render).toHaveBeenCalledTimes(1);
    expect(result.current.svgContent).toBe(
      '<svg width="20" height="10"><text>new</text></svg>'
    );
  });

  it("invalidates a pending render when the plugin is removed", async () => {
    vi.useFakeTimers();
    const first = pending();
    const engine = plugin(vi.fn(() => first.promise));
    const { result } = renderHook(useDiagramRender);
    act(() => result.current.requestRender(request(engine)));
    act(() => result.current.requestRender(null));
    await act(async () => {
      first.resolve({ svg: "<svg>stale</svg>" });
      await vi.runAllTimersAsync();
    });
    expect(result.current.svgContent).toBe("");
    expect(engine.render).toHaveBeenCalledTimes(1);
  });

  it("cancels cooldown timers when unmounted", async () => {
    vi.useFakeTimers();
    const engine = plugin(vi.fn(async () => ({ svg: "<svg/>" })));
    const { result, unmount } = renderHook(useDiagramRender);
    await act(async () => {
      result.current.requestRender(request(engine));
      await Promise.resolve();
    });
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
