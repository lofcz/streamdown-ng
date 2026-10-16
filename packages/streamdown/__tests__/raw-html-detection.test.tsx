import { render } from "@testing-library/react";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import { Markdown } from "../lib/markdown";

const html = "Text with <em>HTML</em> here";

describe("raw HTML detection", () => {
  it("renders raw HTML by default", () => {
    const { container } = render(<Streamdown>{html}</Streamdown>);
    expect(container.querySelector("em")?.textContent).toBe("HTML");
  });

  it("escapes HTML when custom rehypePlugins do not include rehype-raw", () => {
    const { container } = render(
      <Markdown rehypePlugins={[() => undefined]}>{html}</Markdown>
    );
    expect(container.querySelector("em")).toBeNull();
    expect(container.innerHTML).toContain("&lt;em&gt;");
  });

  it("detects a user-supplied rehypeRaw", () => {
    const { container } = render(
      <Markdown rehypePlugins={[rehypeRaw]}>{html}</Markdown>
    );
    expect(container.querySelector("em")?.textContent).toBe("HTML");
  });

  it("detects rehypeRaw passed with options", () => {
    const { container } = render(
      <Markdown rehypePlugins={[[rehypeRaw, {}]]}>{html}</Markdown>
    );
    expect(container.querySelector("em")?.textContent).toBe("HTML");
  });

  it("allows a renamed wrapper around a user-supplied parser", () => {
    const parser = (...options: Parameters<typeof rehypeRaw>) =>
      rehypeRaw(...options);
    const { container } = render(
      <Markdown rehypePlugins={[parser]}>{html}</Markdown>
    );
    expect(container.querySelector("em")?.textContent).toBe("HTML");
  });

  it("preserves unparsed HTML before a supplied sanitizer", () => {
    const { container } = render(
      <Markdown rehypePlugins={[rehypeSanitize]}>{html}</Markdown>
    );
    expect(container.querySelector("em")).toBeNull();
    expect(container.textContent).toBe(html);
  });

  it("omits raw HTML when skipHtml is enabled without leaking processor state", () => {
    const first = render(
      <Markdown rehypePlugins={[rehypeSanitize]} skipHtml>
        {html}
      </Markdown>
    );
    const second = render(
      <Markdown rehypePlugins={[rehypeSanitize]}>{html}</Markdown>
    );
    expect(first.container.textContent).toBe("Text with HTML here");
    expect(second.container.textContent).toBe(html);
  });
});
