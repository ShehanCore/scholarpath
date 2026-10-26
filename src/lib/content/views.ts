import { levelsText, universityHref } from "@/lib/format";
import { rankLabel } from "@/lib/rank";
import type { UniversityRow } from "@/components/university-table";
import type { LevelCode, Scholarship, University } from "./types";

/** Scholarships offered by a university, and national ones (same country, no owning university) usable there. */
export function scholarshipsFor(u: Pick<University, "id" | "countryCode">, scholarships: Scholarship[]) {
  return {
    offered: scholarships.filter((s) => s.universityId === u.id),
    national: scholarships.filter((s) => s.destinationCode === u.countryCode && s.universityId === null),
  };
}

export function universityRow(u: University, scholarships: Scholarship[]): UniversityRow {
  const { offered, national } = scholarshipsFor(u, scholarships);
  const usable = [...offered, ...national];
  return {
    id: u.id,
    href: universityHref(u.id),
    rank: rankLabel(u),
    ranked: u.rankDisplay !== null,
    name: u.name,
    city: u.city ?? "Not published",
    scholarships: usable.length,
    levelsText: u.levels.length ? levelsText(u.levels, true) : "Not published",
    scholarshipLevels: [...new Set(usable.flatMap((s) => s.levels))] as LevelCode[],
  };
}

/** "the United Kingdom", "Australia". */
export function withArticle(name: string): string {
  return /^(United |Netherlands)/.test(name) ? `the ${name}` : name;
}
