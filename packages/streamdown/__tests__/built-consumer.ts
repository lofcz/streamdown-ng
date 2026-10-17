import { execFileSync } from "node:child_process";
import { readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const tsupEntry = require.resolve("tsup");

interface Output {
  entryPoint?: string;
  imports: { external?: boolean; kind: string; path: string }[];
}

const staticReachable = (
  outputs: Record<string, Output>,
  roots: string[]
): Set<string> => {
  const seen = new Set<string>();
  const pending = [...roots];
  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || seen.has(file)) {
      continue;
    }
    seen.add(file);
    for (const imported of outputs[file]?.imports ?? []) {
      if (!imported.external && imported.kind === "import-statement") {
        pending.push(imported.path);
      }
    }
  }
  return seen;
};

export const packageEntry = (name = "index") =>
  path.resolve(import.meta.dirname, `../dist/${name}.js`);

/** Bundle the actual published files with production minification and splitting. */
export const bundleConsumer = (workDir: string, source: string) => {
  symlinkSync(
    path.resolve(import.meta.dirname, "../node_modules"),
    path.join(workDir, "node_modules"),
    "dir"
  );
  writeFileSync(path.join(workDir, "package.json"), '{"type":"module"}');
  writeFileSync(path.join(workDir, "app.tsx"), source);
  writeFileSync(
    path.join(workDir, "build.mjs"),
    `import { build } from ${JSON.stringify(pathToFileURL(tsupEntry).href)};
await build({
  entry: { app: "app.tsx" },
  external: ["react", "react-dom", "react/jsx-runtime", "react-dom/client", "react-dom/server", "three", /^three\\//],
  format: ["esm"],
  minify: true,
  metafile: true,
  outDir: "out",
  silent: true,
  splitting: true,
});`
  );
  execFileSync(process.execPath, ["build.mjs"], {
    cwd: workDir,
    stdio: "pipe",
  });
  const { inputs, outputs } = JSON.parse(
    readFileSync(path.join(workDir, "out/metafile-esm.json"), "utf8")
  ) as { inputs: Record<string, unknown>; outputs: Record<string, Output> };
  const entry = Object.keys(outputs).find((file) =>
    outputs[file].entryPoint?.endsWith("app.tsx")
  );
  if (!entry) {
    throw new Error("The consumer build produced no entry");
  }
  const upfrontFiles = staticReachable(outputs, [entry]);
  const read = (files: Iterable<string>) =>
    [...files]
      .map((file) => readFileSync(path.resolve(workDir, file), "utf8"))
      .join("\n");
  return {
    entry: pathToFileURL(path.resolve(workDir, entry)).href,
    inputs: Object.keys(inputs),
    upfront: read(upfrontFiles),
    deferred: read(
      Object.keys(outputs).filter(
        (file) => file.endsWith(".js") && !upfrontFiles.has(file)
      )
    ),
  };
};

export const dependencyEntry = (name: string) => require.resolve(name);

/** Run built code in Node, outside Vitest's source-module transform cache. */
export const evaluateConsumer = <T>(entry: string, expression: string): T =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
    const consumer = await import(${JSON.stringify(entry)});
    console.log(JSON.stringify(${expression}));
  `,
      ],
      { encoding: "utf8" }
    )
  ) as T;

export type ConsumerBundle = ReturnType<typeof bundleConsumer>;
