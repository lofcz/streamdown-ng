import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  bundleConsumer,
  type ConsumerBundle,
  packageEntry,
} from "./built-consumer";

// The engine names each rehype plugin it creates `rehypeAnimate$<id>`.
const engineMarker = /rehypeAnimate\$/;

describe.each(["index", "core"])("%s word fade bundle boundary", (entry) => {
  let workDir = "";
  let bundle: ConsumerBundle;

  beforeAll(() => {
    workDir = mkdtempSync(path.join(tmpdir(), "streamdown-consumer-"));
    bundle = bundleConsumer(
      workDir,
      `import { Streamdown } from ${JSON.stringify(packageEntry(entry))}; export { Streamdown };`
    );
  }, 60_000);

  afterAll(() => {
    if (workDir) {
      rmSync(workDir, { force: true, recursive: true });
    }
  });

  it("loads the word fade only through import() in an app that never imports it", () => {
    expect(bundle.upfront).not.toMatch(engineMarker);
    expect(bundle.deferred).toMatch(engineMarker);
  });
});
