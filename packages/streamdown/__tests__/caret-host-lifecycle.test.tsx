import { act, render } from "@testing-library/react";
import { useRef, useState } from "react";
import { expect, it } from "vitest";
import { useCaretHost } from "../lib/use-caret-host";

it("marks a host replaced by a child without a Streamdown render", async () => {
  let replace: () => void = () => undefined;
  const Child = () => {
    const [ready, setReady] = useState(false);
    replace = () => setReady(true);
    return ready ? <section>diagram</section> : <div>loading</div>;
  };
  const Parent = () => {
    const ref = useRef<HTMLDivElement>(null);
    useCaretHost(true, ref);
    return (
      <div ref={ref}>
        <Child />
      </div>
    );
  };
  const { container } = render(<Parent />);
  expect(container.querySelector("[data-sd-caret-hidden]")?.tagName).toBe(
    "DIV"
  );
  await act(async () => {
    replace();
    await Promise.resolve();
  });
  expect(container.querySelector("[data-sd-caret-hidden]")?.tagName).toBe(
    "SECTION"
  );
});
