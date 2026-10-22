import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { dependencyEntry } from "./built-consumer";

describe("published entry declarations", () => {
  let directory = "";

  beforeAll(() => {
    directory = mkdtempSync(path.join(tmpdir(), "streamdown-types-"));
    mkdirSync(path.join(directory, "node_modules/@lofcz"), { recursive: true });
    symlinkSync(
      path.resolve(import.meta.dirname, ".."),
      path.join(directory, "node_modules/@lofcz/streamdown"),
      "dir"
    );
    writeFileSync(path.join(directory, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(directory, "consumer.ts"),
      `import { Streamdown, defaultRehypePlugins, parseMarkdownIntoBlocksIncremental, type IncrementalParseState, type StreamdownProps, type AnimationEffect, type PluginConfig } from "@lofcz/streamdown/core";
import { animate, createAnimatePlugin, type AnimationEngine } from "@lofcz/streamdown/animate";
const engine: AnimationEngine = animate;
const plugins: PluginConfig = { animate: engine };
const effect: AnimationEffect = { name: "custom", decorate: (word, seed) => ({ "data-word": word, "data-seed": String(seed) }) };
const options: StreamdownProps = { animated: { animation: effect, duration: 150 }, plugins, rehypePlugins: Object.values(defaultRehypePlugins) };
const standalone = createAnimatePlugin({ animation: effect });
const parsed: IncrementalParseState = parseMarkdownIntoBlocksIncremental("text", null);
parsed.definitions?.hasFootnoteReference("[^note]");
// @ts-expect-error Scanner declarations must keep their string parameter type.
parsed.definitions?.hasFootnoteReference(123);
// @ts-expect-error Raw fence languages must remain strings.
const invalidLanguages: StreamdownProps = { codeBlockRawLanguages: [123] };
// @ts-expect-error Public animation options must retain their types.
const invalid: StreamdownProps = { animated: { duration: "slow" } };
// @ts-expect-error The engine must retain its timeline option types.
animate.createTimeline({ maxBacklogMs: "slow" });
// @ts-expect-error The standalone factory must retain its option types.
createAnimatePlugin({ duration: "slow" });
export { Streamdown, options, standalone, invalid, invalidLanguages, parsed };
`
    );
  });

  afterAll(() => {
    if (directory) {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it.each([
    ["NodeNext", "NodeNext"],
    ["ESNext", "Bundler"],
  ])(
    "supports %s consumers",
    (module, resolution) => {
      const tsc = path.join(
        path.dirname(dependencyEntry("typescript/package.json")),
        "bin/tsc"
      );
      const result = spawnSync(
        process.execPath,
        [
          tsc,
          "--noEmit",
          "--strict",
          "--skipLibCheck",
          "--target",
          "ES2022",
          "--module",
          module,
          "--moduleResolution",
          resolution,
          "consumer.ts",
        ],
        { cwd: directory, encoding: "utf8" }
      );
      expect(result.error).toBeUndefined();
      expect(result.stdout + result.stderr).toBe("");
      expect(result.status).toBe(0);
    },
    60_000
  );
});
