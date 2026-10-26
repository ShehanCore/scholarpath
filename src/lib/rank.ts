import type { University } from "@/lib/content/types";

export const RANK_TO_CONFIRM = "Rank band: to confirm";
export const RANK_YEAR = 2027;
export const RANK_SOURCE = "Times Higher Education World University Rankings 2027";
export const RANK_SOURCE_URL = "https://www.timeshighereducation.com/world-university-rankings";
export const RANK_ATTRIBUTION =
  "Ranking source: Times Higher Education World University Rankings 2027 (published September 2026).";

/** THE rank text as shown in the UI: "=17", "301–350", or "Rank band: to confirm". */
export function rankLabel(u: Pick<University, "rankDisplay">): string {
  return u.rankDisplay ?? RANK_TO_CONFIRM;
}

/** Sort key: the first number in a rank ("=17" → 17, "301–350" → 301, "1501+" → 1501). */
export function rankSortKey(rank: string | null): number {
  const m = rank?.match(/\d+/);
  return m ? Number(m[0]) : Number.POSITIVE_INFINITY;
}

/** Ascending rank; universities without a rank go last, then by name. */
export function byRank(a: Pick<University, "rankSort" | "name">, b: Pick<University, "rankSort" | "name">) {
  return (a.rankSort ?? Infinity) - (b.rankSort ?? Infinity) || a.name.localeCompare(b.name);
}

/** Validates a rank as entered or published and returns both stored fields, or null if it isn't a rank. */
export function parseRank(raw: string): { rankDisplay: string; rankSort: number } | null {
  const rankDisplay = normaliseTheRank(raw);
  return rankDisplay ? { rankDisplay, rankSort: rankSortKey(rankDisplay) } : null;
}

/** Normalises a rank cell copied from THE: trims, unifies dashes, keeps "=" ties and "+" bands. */
export function normaliseTheRank(raw: string): string | null {
  const r = raw.trim().replace(/\s+/g, "").replace(/[-‐‑‒—]/g, "–");
  return /^(=?\d+|\d+–\d+|\d+\+)$/.test(r) ? r : null;
}
