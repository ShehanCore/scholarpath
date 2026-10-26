import type { Metadata } from "next";
import { Suspense } from "react";
import { DeadlinesApp } from "@/components/deadlines/deadlines-app";
import { getDestinations, getScholarships } from "@/lib/db/queries";
import { getToday } from "@/lib/today";

export const metadata: Metadata = {
  title: "Deadlines",
  description: "Closing dates for your saved scholarships and featured awards, by month or as a list, with email reminders.",
};

export default async function DeadlinesPage() {
  const [scholarships, destinations, today] = await Promise.all([getScholarships(), getDestinations(), getToday()]);
  const destNames = Object.fromEntries(destinations.map((d) => [d.code, d.name]));
  return (
    <Suspense fallback={<div aria-busy="true" aria-label="Loading deadlines" className="mt-10 h-[480px] rounded-card-lg bg-surface" />}>
      <DeadlinesApp scholarships={scholarships} destNames={destNames} today={today} />
    </Suspense>
  );
}
