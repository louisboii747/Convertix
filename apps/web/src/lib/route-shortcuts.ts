export function parseSavedRoutes(
  raw: string | null,
  allowed: ReadonlySet<string>,
  limit = 12,
): string[] {
  if (!raw || raw.length > 4096) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return [
      ...new Set(
        value.filter(
          (route): route is string =>
            typeof route === "string" && allowed.has(route),
        ),
      ),
    ].slice(0, limit);
  } catch {
    return [];
  }
}
