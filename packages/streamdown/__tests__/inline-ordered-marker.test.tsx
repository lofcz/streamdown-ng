import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import { Markdown } from "../lib/markdown";
import { remarkInlineOrderedMarker } from "../lib/remark/inline-ordered-marker";

const renderPlugin = (content: string) =>
  render(
    <Markdown children={content} remarkPlugins={[remarkInlineOrderedMarker]} />
  ).container;

describe("remarkInlineOrderedMarker", () => {
  it("keeps a date after a bullet as literal text", () => {
    const container = renderPlugin("- 23. říjen 1618: vyhození místodržících");
    expect(container.querySelector("ol")).toBeNull();
    const li = container.querySelector("li");
    expect(li?.textContent).toBe("23. říjen 1618: vyhození místodržících");
  });

  it("does not turn `1.` after a bullet into a nested list", () => {
    const container = renderPlugin("- 1. září 1939: napadení Polska");
    expect(container.querySelector("ol")).toBeNull();
    expect(container.querySelector("li")?.textContent).toBe(
      "1. září 1939: napadení Polska"
    );
  });

  it("preserves the original delimiter", () => {
    const container = renderPlugin("- 23) říjen");
    expect(container.querySelector("ol")).toBeNull();
    expect(container.querySelector("li")?.textContent).toBe("23) říjen");
  });

  it("folds the marker inside ordered parents too", () => {
    const container = renderPlugin("1. 23. říjen\n2. 24. říjen");
    expect(container.querySelectorAll("ol")).toHaveLength(1);
    const items = [...container.querySelectorAll("li")].map(
      (li) => li.textContent
    );
    expect(items).toEqual(["23. říjen", "24. říjen"]);
  });

  it("keeps inline formatting that follows the number", () => {
    const container = renderPlugin("- 21. **červen** 1621: exekuce");
    expect(container.querySelector("ol")).toBeNull();
    const li = container.querySelector("li");
    expect(li?.textContent).toBe("21. červen 1621: exekuce");
    expect(li?.querySelector("strong")?.textContent).toBe("červen");
  });

  it("leaves a genuine nested ordered list on its own lines alone", () => {
    const container = renderPlugin("- Body\n  1. jedna\n  2. dva");
    const ol = container.querySelector("ul > li > ol");
    expect(ol).toBeTruthy();
    expect(ol?.querySelectorAll("li")).toHaveLength(2);
  });

  it("leaves a multi-item nested list that starts inline alone", () => {
    const container = renderPlugin("- 23. říjen\n  24. listopad");
    const ol = container.querySelector("ul > li > ol");
    expect(ol?.getAttribute("start")).toBe("23");
    expect(ol?.querySelectorAll("li")).toHaveLength(2);
  });

  it("keeps sibling content of the item after folding", () => {
    const container = renderPlugin(
      "- 23. říjen\n\n  Druhý odstavec\n- další bod"
    );
    expect(container.querySelector("ol")).toBeNull();
    const first = container.querySelector("li");
    const paragraphs = [...(first?.querySelectorAll("p") ?? [])].map(
      (p) => p.textContent
    );
    expect(paragraphs).toEqual(["23. říjen", "Druhý odstavec"]);
  });

  it("is part of the default Streamdown remark stack", () => {
    const { container } = render(
      <Streamdown children={"- 23. květen 1618: defenestrace"} />
    );
    expect(container.querySelector("ol")).toBeNull();
    expect(container.querySelector("li")?.textContent).toContain(
      "23. květen 1618: defenestrace"
    );
  });
});
