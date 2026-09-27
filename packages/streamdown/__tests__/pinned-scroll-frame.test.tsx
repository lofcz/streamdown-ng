import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePinnedScroll } from "../lib/use-pinned-scroll";

const frames = new Map<number, FrameRequestCallback>();
let nextId = 0;
const flush = () => {
  const pending = [...frames.values()];
  frames.clear();
  act(() => {
    for (const callback of pending) {
      callback(0);
    }
  });
};
const Region = ({ content = 0, active = true, enabled = true }) => {
  const ref = usePinnedScroll({ content, isAnimating: active, enabled });
  return (
    <div data-testid="region" ref={ref}>
      {content}
    </div>
  );
};
beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = ++nextId;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
});
afterEach(() => {
  frames.clear();
  vi.unstubAllGlobals();
});

describe("frame-coalesced pinning", () => {
  it("pins once per frame and lets the final pin survive stream completion", () => {
    const { getByTestId, rerender } = render(<Region />);
    const el = getByTestId("region");
    const height = vi.fn(() => 1000);
    Object.defineProperty(el, "scrollHeight", { get: height });
    el.scrollTo = vi.fn();
    rerender(<Region content={1} />);
    rerender(<Region content={2} />);
    rerender(<Region active={false} content={3} />);
    expect(height).not.toHaveBeenCalled();
    flush();
    expect(height).toHaveBeenCalledTimes(1);
    expect(el.scrollTo).toHaveBeenCalledTimes(1);
  });

  it("does not re-latch a pending pin when the user scrolls up then streaming ends", () => {
    const { getByTestId, rerender } = render(<Region />);
    const el = getByTestId("region");
    el.scrollTo = vi.fn();
    fireEvent.wheel(el, { deltaY: -10 });
    rerender(<Region active={false} content={2} />);
    flush();
    expect(el.scrollTo).not.toHaveBeenCalled();
  });

  it("cancels a queued pin when disabled and on unmount", () => {
    const { getByTestId, rerender, unmount } = render(<Region />);
    const el = getByTestId("region");
    el.scrollTo = vi.fn();
    rerender(<Region enabled={false} />);
    flush();
    expect(el.scrollTo).not.toHaveBeenCalled();
    rerender(<Region />);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
  });
});
