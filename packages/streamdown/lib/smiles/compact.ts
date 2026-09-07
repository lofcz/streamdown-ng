const FIRST_TOKEN = /\s+/;

/**
 * Same default as `@streamdown/smiles` `resolveCompactDrawing` when the
 * option is omitted: reaction SMILES start compact, molecules start skeletal.
 * Kept here so core UI does not import the plugin package.
 */
export function defaultSmilesCompactDrawing(source: string): boolean {
  const token = source.trim().split(FIRST_TOKEN, 1).at(0) ?? "";
  return token.includes(">");
}

export function readConfiguredCompactDrawing(
  config: unknown
): boolean | undefined {
  if (!config || typeof config !== "object" || !("compactDrawing" in config)) {
    return;
  }
  const value = (config as { compactDrawing: unknown }).compactDrawing;
  return typeof value === "boolean" ? value : undefined;
}

export function withSmilesCompactDrawing(
  config: unknown,
  compactDrawing: boolean
): unknown {
  const base =
    typeof config === "object" && config !== null
      ? (config as Record<string, unknown>)
      : {};
  return { ...base, compactDrawing };
}
