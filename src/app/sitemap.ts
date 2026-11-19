import type { MetadataRoute } from "next";
import { getDestinations, getScholarships, getUniversities } from "@/lib/db/queries";
import { destinationHref, scholarshipHref, universityHref } from "@/lib/format";
import { siteUrl } from "@/lib/site-url";
import { disciplines, levels } from "@/lib/taxonomy";

// Public pages for search engines. Account, admin and API routes are left out (see robots.ts).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [scholarships, destinations, universities] = await Promise.all([getScholarships(), getDestinations(), getUniversities()]);
  const page = (path: string, priority = 0.5, lastModified?: string): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    priority,
    ...(lastModified ? { lastModified } : {}),
  });
  return [
    page("/", 1),
    page("/scholarships", 0.9),
    page("/destinations", 0.8),
    page("/checklist", 0.7),
    page("/deadlines", 0.6),
    ...["/about", "/how-we-verify", "/rankings-note", "/adviser", "/privacy", "/terms"].map((p) => page(p, 0.3)),
    ...scholarships.map((s) => page(scholarshipHref(s.id), 0.8, s.lastVerified)),
    ...destinations.map((d) => page(destinationHref(d.code), 0.7)),
    ...universities.map((u) => page(universityHref(u.id), 0.5)),
    ...disciplines.map((d) => page(`/disciplines/${d.slug}`, 0.6)),
    ...levels.map((l) => page(`/levels/${l.slug}`, 0.6)),
  ];
}
