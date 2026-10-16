import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  bundleConsumer,
  dependencyEntry,
  evaluateConsumer,
  packageEntry,
} from "./built-consumer";

const RAW_DEPENDENCY = /(?:rehype-raw|hast-util-raw|parse5)[/\\]/;
const directories: string[] = [];
const build = (entry: string, withRaw = false) => {
  const directory = mkdtempSync(path.join(tmpdir(), "streamdown-core-"));
  directories.push(directory);
  return bundleConsumer(
    directory,
    `
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Streamdown, defaultRehypePlugins } from ${JSON.stringify(packageEntry(entry))};
${withRaw ? `import raw from ${JSON.stringify(dependencyEntry("rehype-raw"))};` : ""}
export const parserName = ${withRaw ? "raw.name" : '"none"'};
export const rawDefault = Object.hasOwn(defaultRehypePlugins, "raw");
export const render = (text, props = {}) => renderToStaticMarkup(createElement(Streamdown, {
  mode: "static",
  ${withRaw ? "rehypePlugins: [[raw, {}], ...Object.values(defaultRehypePlugins)]," : ""}
  ...props,
}, text));
`
  );
};

afterAll(() => {
  for (const directory of directories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("built core entry", () => {
  it("omits rehype-raw and parse5 while displaying HTML literally", () => {
    const bundle = build("core");
    expect(bundle.inputs.some((input) => RAW_DEPENDENCY.test(input))).toBe(
      false
    );
    const result = evaluateConsumer<{
      rawDefault: boolean;
      inline: string;
      block: string;
      skipped: string;
    }>(
      bundle.entry,
      `({
      rawDefault: consumer.rawDefault,
      inline: consumer.render("Text with <em>HTML</em> here"),
      block: consumer.render("<div>block</div>"),
      skipped: consumer.render("<div>block</div>", { skipHtml: true }),
    })`
    );
    expect(result.rawDefault).toBe(false);
    expect(result.inline).toContain("&lt;em&gt;HTML&lt;/em&gt;");
    expect(result.inline).not.toContain("<em>");
    expect(result.block).toContain("&lt;div&gt;block&lt;/div&gt;");
    expect(result.skipped).not.toContain("block");
  }, 60_000);

  it("accepts minified user-supplied raw parsers and retains sanitization", () => {
    const bundle = build("core", true);
    const result = evaluateConsumer<{
      name: string;
      inline: string;
      unsafe: string;
    }>(
      bundle.entry,
      `({
      name: consumer.parserName,
      inline: consumer.render("Text with <em>HTML</em> here"),
      unsafe: consumer.render('<script>alert(1)</script>\\n\\n<a href="javascript:alert(1)">link</a>'),
    })`
    );
    expect(result.name).not.toBe("rehypeRaw");
    expect(result.inline).toContain("<em>HTML</em>");
    expect(result.unsafe).not.toContain("<script");
    expect(result.unsafe).not.toContain("javascript:");
  }, 60_000);

  it("keeps raw HTML enabled in the default entry", () => {
    const bundle = build("index");
    const result = evaluateConsumer<{ rawDefault: boolean; html: string }>(
      bundle.entry,
      `({
      rawDefault: consumer.rawDefault,
      html: consumer.render("Text with <em>HTML</em> here"),
    })`
    );
    expect(result.rawDefault).toBe(true);
    expect(result.html).toContain("<em>HTML</em>");
  }, 60_000);
});
