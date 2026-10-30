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
