import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

const Entity = ({ id, children }: { id?: string; children?: ReactNode }) => (
  <span data-entity-id={id}>{children}</span>
);

describe.each([
  "static",
  "streaming",
] as const)("protected identifiers in %s mode", (mode) => {
  it("protects native HTML ids and names and updates local links", () => {
    const { container } = render(
      <Streamdown linkSafety={{ enabled: false }} mode={mode}>
        {
          '<div id="clobbered">target</div>\n\n<a name="anchor" href="#clobbered">jump</a>'
        }
      </Streamdown>
    );
    expect(container.querySelector("#user-content-clobbered")).toBeTruthy();
    expect(
      container.querySelector('[name="user-content-anchor"]')
    ).toBeTruthy();
    expect(
      container.querySelector('a[href="#user-content-clobbered"]')
    ).toBeTruthy();
    expect(
      (window as unknown as Record<string, unknown>).clobbered
    ).toBeUndefined();
  });

  it("preserves application IDs for custom components and protects unmapped custom elements", () => {
    const { container } = render(
      <Streamdown
        allowedTags={{ entity: ["id"], unknown: ["id"] }}
        components={{ entity: Entity }}
        mode={mode}
      >
        {
          '<entity id="123">reference</entity>\n\n<unknown id="unsafe">fallback</unknown>'
        }
      </Streamdown>
    );
    expect(container.querySelector('[data-entity-id="123"]')).toBeTruthy();
    expect(container.querySelector("#user-content-unsafe")).toBeTruthy();
    expect(container.querySelector("#unsafe")).toBeNull();
  });

  it("keeps footnote links and accessible labels attached to their targets", () => {
    const { container } = render(
      <Streamdown linkSafety={{ enabled: false }} mode={mode}>
        {"A note[^1].\n\n[^1]: Explanation."}
      </Streamdown>
    );
    expect(
      container.querySelector('[id^="user-content-user-content-"]')
    ).toBeNull();
    const references = container.querySelectorAll("a[href^='#']");
    expect(references.length).toBeGreaterThan(0);
    for (const anchor of references) {
      const target = anchor.getAttribute("href")?.slice(1);
      expect(container.querySelector(`[id="${target}"]`)).toBeTruthy();
    }
    for (const node of container.querySelectorAll("[aria-describedby]")) {
      for (const id of (node.getAttribute("aria-describedby") ?? "").split(
        " "
      )) {
        expect(container.querySelector(`[id="${id}"]`)).toBeTruthy();
      }
    }
  });

  it("keeps structured payload identifiers unchanged", () => {
    const Payload = (props: Record<string, unknown>) => (
      <span data-testid="payload">{String(props["data-content"])}</span>
    );
    const { container } = render(
      <Streamdown
        allowedTags={{ payload: [], item: ["id"] }}
        components={{ payload: Payload }}
        dataOnlyTags={["payload"]}
        mode={mode}
      >
        {'<payload><item id="123">value</item></payload>'}
      </Streamdown>
    );
    const payload = JSON.parse(
      container.querySelector('[data-testid="payload"]')?.textContent ?? "[]"
    );
    expect(payload[0].props.id).toBe("123");
  });
});
