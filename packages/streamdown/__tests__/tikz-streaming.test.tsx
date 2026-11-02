import { render, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { BlockIncompleteContext } from "../lib/block-incomplete-context";
import { Diagram } from "../lib/diagram";
import { createTikzPlugin } from "../lib/tikz";

it("waits for a closed TikZ fence before invoking TeX", async () => {
  const compile = vi.fn(async () => ({
    src: "data:image/svg+xml;base64,PHN2Zy8+",
    width: 100,
    height: 50,
  }));
  const plugin = createTikzPlugin({ render: compile });
  const { rerender } = render(
    <BlockIncompleteContext value={true}>
      <Diagram chart="source" fullscreen plugin={plugin} />
    </BlockIncompleteContext>
  );
  expect(compile).not.toHaveBeenCalled();
  rerender(
    <BlockIncompleteContext value={false}>
      <Diagram chart="source" fullscreen plugin={plugin} />
    </BlockIncompleteContext>
  );
  await waitFor(() => expect(compile).toHaveBeenCalledTimes(1));
});

it("feeds the failed source to the host repair component after a valid preview", async () => {
  const { StreamdownContext, defaultStreamdownContext } = await import(
    "../lib/streamdown-context"
  );
  const errors: string[] = [];
  const compile = vi.fn((source: string) => {
    if (source === "broken") {
      return Promise.reject(new Error("Undefined loop variable"));
    }
    return Promise.resolve({
      src: "data:image/svg+xml;base64,PHN2Zy8+",
      width: 100,
      height: 50,
    });
  });
  const plugin = createTikzPlugin({ render: compile });
  const ErrorComponent = ({
    chart,
    error,
    retry,
  }: import("../index").DiagramErrorComponentProps) => {
    errors.push(chart);
    return (
      <button onClick={retry} type="button">
        {chart}: {error}
      </button>
    );
  };
  const view = (chart: string, incomplete = false) => (
    <StreamdownContext
      value={{
        ...defaultStreamdownContext,
        diagrams: { tikz: { errorComponent: ErrorComponent } },
      }}
    >
      <BlockIncompleteContext value={incomplete}>
        <Diagram chart={chart} fullscreen plugin={plugin} />
      </BlockIncompleteContext>
    </StreamdownContext>
  );
  const { container, rerender, getByRole, queryByRole } = render(view("good"));
  await waitFor(() => expect(container.querySelector("svg")).not.toBeNull());
  rerender(view("broken", true));
  expect(compile).toHaveBeenCalledTimes(1);
  expect(errors).toEqual([]);
  rerender(view("broken"));
  await waitFor(() =>
    expect(
      getByRole("button", { name: "broken: Undefined loop variable" })
    ).toBeTruthy()
  );
  getByRole("button", { name: "broken: Undefined loop variable" }).click();
  await waitFor(() => expect(compile).toHaveBeenCalledTimes(3));
  rerender(view("fixed"));
  await waitFor(() => expect(compile).toHaveBeenCalledWith("fixed"));
  await waitFor(() =>
    expect(
      queryByRole("button", { name: "broken: Undefined loop variable" })
    ).toBeNull()
  );
  expect(errors.every((source) => source === "broken")).toBe(true);
});
