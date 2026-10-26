import type { Destination, Scholarship, University } from "@/lib/content/types";
import { destinationHref, scholarshipHref, universityHref } from "@/lib/format";
import { disciplines, levels } from "@/lib/taxonomy";

export type SearchEntry = { label: string; type: string; href: string };

/** Everything the home search suggests, in the prototype's order. */
export function buildSearchIndex(
  scholarships: Scholarship[],
  destinations: Destination[],
  universities: University[],
): SearchEntry[] {
  return [
    ...scholarships.map((s) => ({ label: s.name, type: "Scholarship", href: scholarshipHref(s.id) })),
    ...destinations.map((d) => ({ label: d.name, type: "Destination", href: destinationHref(d.code) })),
    ...universities.map((u) => ({ label: u.name, type: `University · ${u.countryCode}`, href: universityHref(u.id) })),
    ...disciplines.map((d) => ({ label: d.name, type: "Discipline", href: `/disciplines/${d.slug}` })),
    ...levels.map((l) => ({ label: l.name, type: "Level", href: `/levels/${l.slug}` })),
  ];
}

export function searchMatches(index: SearchEntry[], query: string, limit = 8): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return index.filter((e) => e.label.toLowerCase().includes(q)).slice(0, limit);
}
