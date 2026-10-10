import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Streamdown } from "../index";
import { Markdown } from "../lib/markdown";

afterEach(cleanup);

it("does not run the streaming block splitter for static history", () => {
  const split = vi.fn(() => ["wrong content"]);
  const { container } = render(
    <Streamdown mode="static" parseMarkdownIntoBlocksFn={split}>
      **History**
    </Streamdown>
  );
  expect(
    container.querySelector('[data-streamdown="strong"]')?.textContent
  ).toBe("History");
  expect(split).not.toHaveBeenCalled();
});

it("keeps same-named plugin closures isolated across messages", () => {
  const plugin = (value: string) =>
    function rewrite() {
      return (tree: any) => {
        tree.children[0].children[0].value = value;
      };
    };
  const first = render(
    <Markdown remarkPlugins={[plugin("first")]}>original</Markdown>
  );
  const second = render(
    <Markdown remarkPlugins={[plugin("second")]}>original</Markdown>
  );
  expect(first.container.textContent).toBe("first");
  expect(second.container.textContent).toBe("second");
});

it("keeps callback options isolated and accepts cyclic plugin options", () => {
  function rewrite(options: { value: () => string }) {
    return (tree: any) => {
      tree.children[0].children[0].value = options.value();
    };
  }
  const first = { value: () => "first" };
  const second: any = { value: () => "second" };
  second.self = second;
  const a = render(
    <Markdown remarkPlugins={[[rewrite, first]]}>original</Markdown>
  );
  const b = render(
    <Markdown remarkPlugins={[[rewrite, second]]}>original</Markdown>
  );
  expect(a.container.textContent).toBe("first");
  expect(b.container.textContent).toBe("second");
});
