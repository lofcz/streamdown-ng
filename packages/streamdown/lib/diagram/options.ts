export const buildDiagramRenderOptions = (
  config: unknown,
  language?: string
): unknown => {
  if (config === undefined && language === undefined) {
    return;
  }

  const base =
    typeof config === "object" && config !== null
      ? (config as Record<string, unknown>)
      : {};

  return { ...base, language };
};
