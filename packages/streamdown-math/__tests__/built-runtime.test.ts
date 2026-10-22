import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("published math renderer", () => {
  it("renders with the package's declared KaTeX runtime", () => {
    // Run the built entry outside Vitest's transforms and module mocks.
    const result = JSON.parse(
      execFileSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `import katex from "katex";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
let calls = 0;
const original = katex.renderToString;
katex.renderToString = (...args) => { calls += 1; return original(...args); };
const { math } = await import("./dist/index.js");
const processor = unified().use(remarkParse).use(math.remarkPlugin).use(remarkRehype).use([math.rehypePlugin]);
const tree = processor.runSync(processor.parse("$$x^2 + y^2$$"));
console.log(JSON.stringify({ calls, rendered: JSON.stringify(tree).includes("katex"), version: katex.version }));`,
        ],
        { cwd: resolve(import.meta.dirname, ".."), encoding: "utf8" }
      )
    );
    expect(result.calls).toBe(1);
    expect(result.rendered).toBe(true);
    const [major, minor, patch] = result.version.split(".").map(Number);
    expect(major > 0 || minor > 18 || (minor === 18 && patch >= 2)).toBe(true);
  });
});
