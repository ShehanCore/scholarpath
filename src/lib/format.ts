import type { LevelCode, Scholarship } from "@/lib/content/types";
import { daysLeft, statusOf, type DeadlineStatus } from "@/lib/status";
import { levelSubtitles, levels } from "@/lib/taxonomy";
import { formatDate } from "@/lib/verification";

export { formatDate };

const levelName = Object.fromEntries(levels.map((l) => [l.code, l.name])) as Record<LevelCode, string>;
const levelShort: Record<LevelCode, string> = { ...levelName, R: "MPhil & PG" };

/** "Master's, PhD" — or the short form used in rank tables ("MPhil & PG"). */
export function levelsText(codes: LevelCode[], short = false): string {
  return codes.map((c) => (short ? levelShort : levelName)[c]).join(", ");
}

export { levelSubtitles };

/** Destination code as shown on chips: "GB", or "EU+" for Europe-wide. */
export function destinationChip(code: string): string {
  return code === "EU" ? "EU+" : code;
}

export function destinationHref(code: string): string {
  return `/destinations/${code.toLowerCase()}`;
}

export function scholarshipHref(id: string): string {
  return `/scholarships/${id}`;
}

export function universityHref(id: string): string {
  return `/universities/${id}`;
}

/** Everything a scholarship card needs about the deadline. */
export function deadlineView(s: Pick<Scholarship, "opens" | "closes">, today: string) {
  const status: DeadlineStatus = statusOf(s, today);
  const days = daysLeft(s.closes, today);
  return {
    status,
    closed: status === "Closed",
    days: Math.max(days, 0),
    closeText: formatDate(s.closes),
    daysText: status === "Closed" ? "closed" : status === "Upcoming" ? `opens ${formatDate(s.opens)}` : `${days} days left`,
  };
}

/** "National" or "{funder} only", as the prototype's `scope`. */
export function scopeText(s: Pick<Scholarship, "universityId" | "funder">): string {
  return s.universityId ? `${s.funder} only` : "National";
}

export function plural(n: number, one: string, many = one + "s"): string {
  return `${n} ${n === 1 ? one : many}`;
}
