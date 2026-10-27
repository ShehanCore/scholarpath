import type { Metadata } from "next";
import { Suspense } from "react";
import { ChecklistApp } from "@/components/checklist/checklist-app";
import { SupportStrip } from "@/components/support-strip";
import { getDestinations, getScholarships } from "@/lib/db/queries";
import { getToday } from "@/lib/today";

export const metadata: Metadata = {
  title: "Pre-submission checklist",
  description: "Check your application against what committees actually weigh: fit, evidence, clarity, feasibility and impact.",
};

export default async function ChecklistPage() {
  const [scholarships, destinations, today] = await Promise.all([getScholarships(), getDestinations(), getToday()]);
  const destNames = Object.fromEntries(destinations.map((d) => [d.code, d.name]));
  return (
    <>
      <Suspense fallback={<div aria-busy="true" aria-label="Loading checklist" className="mt-10 h-[480px] rounded-card-lg bg-surface" />}>
        <ChecklistApp scholarships={[...scholarships].sort((a, b) => a.name.localeCompare(b.name))} destNames={destNames} today={today} />
      </Suspense>
      <SupportStrip className="mt-4" />
    </>
  );
}
