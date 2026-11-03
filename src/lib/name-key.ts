/** Lookup key for a guest name: ignores case and extra spaces. */
export function nameKey(first: string, last: string): string {
  const clean = (s: string) => s.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
  return `${clean(first)}|${clean(last)}`;
}
