import { render, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { OpenScad } from "../lib/openscad/index";
import { PluginContext } from "../lib/plugin-context";
import type { OpenScadPlugin } from "../lib/plugin-types";
import { defaultStreamdownContext } from "../lib/streamdown-context";

// The viewer needs WebGL; the warning path does not.
vi.mock("../lib/openscad/viewer", () => ({
  OpenScadViewer: () => <div data-testid="viewer" />,
}));

const pluginReturning = (
  warningsBySource: Record<string, string[] | undefined>
): OpenScadPlugin => ({
  name: "openscad",
  type: "model",
  language: ["openscad", "scad"],
  getOpenScad: () => ({
    render: (source) => {
      if (source === "broken") {
        return Promise.reject(new Error("Parser error"));
      }
      return Promise.resolve({
        data: new Uint8Array([1]),
        format: "stl",
        warnings: warningsBySource[source],
      });
    },
  }),
});

const view = (
  code: string,
  plugin: OpenScadPlugin,
  seen: Array<{ code: string; warnings: string[] }>
) => {
  const WarningComponent = (props: { code: string; warnings: string[] }) => {
    seen.push(props);
    return <p data-testid="warning">{props.warnings.join(" | ")}</p>;
  };
  return (
    <PluginContext.Provider value={{ openscad: plugin }}>
      <StreamdownContext
        value={{
          ...defaultStreamdownContext,
          openscad: { warningComponent: WarningComponent },
        }}
      >
        <OpenScad code={code} fullscreen />
      </StreamdownContext>
    </PluginContext.Provider>
  );
};

it("hands a rendered model's warnings to the host with the source they are about", async () => {
  const warning =
    "WARNING: Ignoring unknown module 'bond' in file /input.scad, line 2";
  const plugin = pluginReturning({ partial: [warning], clean: [] });
  const seen: Array<{ code: string; warnings: string[] }> = [];
  const { container, rerender } = render(view("partial", plugin, seen));

  await waitFor(() =>
    expect(
      container.querySelector('[data-testid="warning"]')?.textContent
    ).toBe(warning)
  );
  expect(seen.at(-1)).toEqual({ code: "partial", warnings: [warning] });
  // The model itself still shows.
  expect(container.querySelector('[data-streamdown="openscad"]')).toBeTruthy();

  // A corrected source renders clean: nothing is left to report.
  rerender(view("clean", plugin, seen));
  await waitFor(() =>
    expect(container.querySelector('[data-testid="warning"]')).toBeNull()
  );
});

it("does not report an earlier source's warnings for a source that failed", async () => {
  const plugin = pluginReturning({ partial: ["WARNING: x"] });
  const seen: Array<{ code: string; warnings: string[] }> = [];
  const { container, rerender } = render(view("partial", plugin, seen));
  await waitFor(() =>
    expect(container.querySelector('[data-testid="warning"]')).toBeTruthy()
  );
  rerender(view("broken", plugin, seen));
  await waitFor(() =>
    expect(container.querySelector('[data-testid="warning"]')).toBeNull()
  );
  expect(seen.every((props) => props.code === "partial")).toBe(true);
});

it("renders nothing extra for plugins that report no warnings", async () => {
  const plugin = pluginReturning({ old: undefined });
  const seen: Array<{ code: string; warnings: string[] }> = [];
  const { container } = render(view("old", plugin, seen));
  await waitFor(() =>
    expect(container.querySelector('[data-streamdown="openscad"]')).toBeTruthy()
  );
  expect(seen).toEqual([]);
});
