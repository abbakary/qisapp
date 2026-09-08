import type { Category, Episode, Series } from "./mock/types";

export function normalizeSearchQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function seriesMatchesQuery(
  series: Series,
  query: string,
  extras?: { category?: Category | null; episodes?: Episode[] },
): boolean {
  const needle = normalizeSearchQuery(query).toLowerCase();
  if (!needle) return true;

  const words = needle.split(" ").filter(Boolean);
  const hay = [
    series.title,
    series.titleSw,
    series.description,
    series.descriptionSw,
    series.slug,
    ...(series.tags ?? []),
    extras?.category?.name,
    extras?.category?.nameSw,
    extras?.category?.slug,
    ...(extras?.episodes ?? []).flatMap((e) => [
      e.title,
      e.titleSw,
      e.description,
      e.descriptionSw,
      e.authorName,
    ]),
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  return words.every((word) => hay.includes(word));
}
