export function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function uniqueTags(values: string[]) {
  const normalized = values
    .map(normalizeTag)
    .filter((value) => value.length > 0)
    .map((value) => value.slice(0, 80));

  return Array.from(new Set(normalized));
}
