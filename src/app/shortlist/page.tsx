import type { Metadata } from "next";
import { Suspense } from "react";
import { ShortlistApp, ShortlistSkeleton } from "@/components/shortlist/shortlist-app";
import { getDestinations, getScholarshipUniversities, getScholarships, getUniversities } from "@/lib/db/queries";
import { emailUniversities } from "@/lib/outreach";
import { getToday } from "@/lib/today";

export const metadata: Metadata = {
  title: "My shortlist",
  description: "Your saved scholarships with checklist progress, days left to each deadline and the emails you've sent.",
};

export default async function ShortlistPage() {
  const [scholarships, destinations, universities, usable, today] = await Promise.all([
    getScholarships(),
    getDestinations(),
    getUniversities(),
    getScholarshipUniversities(),
    getToday(),
  ]);
  const destNames = Object.fromEntries(destinations.map((d) => [d.code, d.name]));
  const unis = Object.fromEntries(scholarships.map((s) => [s.id, emailUniversities(s, universities, usable[s.id] ?? [])]));
  return (
    <Suspense fallback={<ShortlistSkeleton />}>
      <ShortlistApp scholarships={scholarships} destNames={destNames} universities={unis} today={today} />
    </Suspense>
  );
}
