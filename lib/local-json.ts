/**
 * Read a single field from a JSON blob stored in localStorage.
 * Guards against SSR (no window) and malformed JSON, returning {} in both cases.
 */
export function loadJsonField<T extends object>(key: string, field: string): T {
  if (typeof window === "undefined") return {} as T;
  try {
    return (JSON.parse(localStorage.getItem(key) ?? "{}")[field] ?? {}) as T;
  } catch {
    return {} as T;
  }
}
