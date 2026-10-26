// Scholarship finder: filters live in the URL so results can be shared and the back button works.
// Params: lv (level codes), disc (discipline slugs), dest (destination codes), aw (award types),
// uni (university id), dl (days until deadline), q (text), sort. Lists are comma-separated.
// There is deliberately no funding filter or funding sort (CLAUDE.md).
import type { LevelCode, Scholarship, University } from "@/lib/content/types";
import { byRank, rankSortKey } from "@/lib/rank";
import { byDeadline, daysLeft, statusOf } from "@/lib/status";
import { disciplines, levels } from "@/lib/taxonomy";

export const AWARD_TYPES = ["Scholarship", "Research grant"] as const;
export const DEADLINE_RANGES = [
  ["any", "Any deadline"],
  ["30", "Within 30 days"],
  ["90", "Within 90 days"],
  ["180", "Within 6 months"],
] as const;
export const SORTS = [
  ["closing", "Closing soon"],
  ["rank", "University rank"],
] as const;

export type FinderSort = (typeof SORTS)[number][0];
export type FinderFilters = {
  lv: LevelCode[];
  disc: string[];
  dest: string[];
  aw: string[];
  uni: string;
  dl: string;
  q: string;
  sort: FinderSort;
};

export const blankFilters: FinderFilters = { lv: [], disc: [], dest: [], aw: [], uni: "", dl: "any", q: "", sort: "closing" };

type Params = { get(name: string): string | null };

const list = (p: Params, key: string) => (p.get(key) ?? "").split(",").map((x) => x.trim()).filter(Boolean);

export function parseFilters(p: Params): FinderFilters {
  const levelCodes = levels.map((l) => l.code);
  const discSlugs = disciplines.map((d) => d.slug);
  const dl = p.get("dl") ?? "any";
  const sort = p.get("sort");
  return {
    lv: list(p, "lv").filter((x): x is LevelCode => (levelCodes as string[]).includes(x)),
    disc: list(p, "disc").filter((x) => discSlugs.includes(x)),
    dest: list(p, "dest").map((x) => x.toUpperCase()),
    aw: list(p, "aw").filter((x) => (AWARD_TYPES as readonly string[]).includes(x)),
    uni: p.get("uni") ?? "",
    dl: DEADLINE_RANGES.some(([v]) => v === dl) ? dl : "any",
    q: (p.get("q") ?? "").trim(),
    sort: SORTS.some(([v]) => v === sort) ? (sort as FinderSort) : "closing",
  };
}

/** Query string for the given filters, leaving out defaults. */
export function filtersToQuery(f: FinderFilters): string {
  const p = new URLSearchParams();
  if (f.lv.length) p.set("lv", f.lv.join(","));
  if (f.disc.length) p.set("disc", f.disc.join(","));
  if (f.dest.length) p.set("dest", f.dest.join(","));
  if (f.aw.length) p.set("aw", f.aw.join(","));
  if (f.uni) p.set("uni", f.uni);
  if (f.dl !== "any") p.set("dl", f.dl);
  if (f.q) p.set("q", f.q);
  if (f.sort !== "closing") p.set("sort", f.sort);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function toggle<T>(values: T[], v: T): T[] {
  return values.includes(v) ? values.filter((x) => x !== v) : [...values, v];
}

export function applyFilters(
  scholarships: Scholarship[],
  universities: University[],
  f: FinderFilters,
  today: string,
): Scholarship[] {
  const discNames = disciplines.filter((d) => f.disc.includes(d.slug)).map((d) => d.name);
  const uni = f.uni ? universities.find((u) => u.id === f.uni) : undefined;
  const q = f.q.toLowerCase();
  const res = scholarships.filter(
    (s) =>
      (!f.lv.length || f.lv.some((l) => s.levels.includes(l))) &&
      (!discNames.length || s.disciplinesAll || discNames.some((d) => s.disciplines.includes(d))) &&
      (!f.dest.length || f.dest.includes(s.destinationCode)) &&
      (!f.aw.length || f.aw.includes(s.awardType)) &&
      // A university's own scholarships, plus national ones for its country.
      (!uni || (s.universityId ? s.universityId === uni.id : s.destinationCode === uni.countryCode)) &&
      (f.dl === "any" || (statusOf(s, today) !== "Closed" && daysLeft(s.closes, today) <= Number(f.dl))) &&
      (!q || `${s.name} ${s.funder}`.toLowerCase().includes(q)),
  );
  return sortResults(res, universities, f.sort, today);
}

/**
 * "University rank" uses the owning university's THE rank, or for national awards the best-ranked
 * university in that country. Unranked sorts last; closed always sorts last; ties fall back to deadline.
 */
export function sortResults(res: Scholarship[], universities: University[], sort: FinderSort, today: string) {
  const deadline = byDeadline(today);
  if (sort !== "rank") return [...res].sort(deadline);
  const ranked = [...universities].sort(byRank);
  const rankOf = (s: Scholarship) => {
    const u = s.universityId
      ? universities.find((x) => x.id === s.universityId)
      : ranked.find((x) => x.countryCode === s.destinationCode && x.theRank);
    return rankSortKey(u?.theRank ?? null);
  };
  const closed = (s: Scholarship) => (statusOf(s, today) === "Closed" ? 1 : 0);
  return [...res].sort((a, b) => closed(a) - closed(b) || rankOf(a) - rankOf(b) || deadline(a, b));
}

export type FilterChip = { label: string; remove: (f: FinderFilters) => FinderFilters };

/** Removable chips for the active filters, in the prototype's order. */
export function activeChips(
  f: FinderFilters,
  names: { destinations: Record<string, string>; universities: Record<string, string> },
): FilterChip[] {
  const chips: FilterChip[] = [];
  for (const l of f.lv)
    chips.push({ label: levels.find((x) => x.code === l)?.name ?? l, remove: (x) => ({ ...x, lv: toggle(x.lv, l) }) });
  for (const d of f.disc)
    chips.push({ label: disciplines.find((x) => x.slug === d)?.name ?? d, remove: (x) => ({ ...x, disc: toggle(x.disc, d) }) });
  for (const c of f.dest)
    chips.push({ label: names.destinations[c] ?? c, remove: (x) => ({ ...x, dest: toggle(x.dest, c) }) });
  for (const a of f.aw) chips.push({ label: a, remove: (x) => ({ ...x, aw: toggle(x.aw, a) }) });
  if (f.uni) chips.push({ label: names.universities[f.uni] ?? f.uni, remove: (x) => ({ ...x, uni: "" }) });
  if (f.dl !== "any") chips.push({ label: `Closes within ${f.dl} days`, remove: (x) => ({ ...x, dl: "any" }) });
  if (f.q) chips.push({ label: `“${f.q}”`, remove: (x) => ({ ...x, q: "" }) });
  return chips;
}
