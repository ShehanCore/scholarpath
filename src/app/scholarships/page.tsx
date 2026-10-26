import type { Metadata } from "next";
import { Suspense } from "react";
import { Finder, FinderSkeleton } from "@/components/finder/finder";
import { Eyebrow } from "@/components/ui/panel";
import { getDestinations, getScholarships, getUniversities } from "@/lib/db/queries";
import { getToday } from "@/lib/today";

export const metadata: Metadata = {
  title: "Find scholarships",
  description: "Combine level, discipline and destination to find scholarships to study abroad. Check your eligibility on each award.",
};

export default async function FinderPage() {
  const [scholarships, universities, destinations, today] = await Promise.all([
    getScholarships(),
    getUniversities(),
    getDestinations(),
    getToday(),
  ]);
  return (
    <>
      <section className="grid items-end gap-5 px-1 pt-[clamp(24px,4vw,48px)] pb-[clamp(16px,3vw,24px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
        <div>
          <Eyebrow className="mb-3 text-teal">Scholarship finder</Eyebrow>
          <h1 className="m-0 font-heading text-[clamp(36px,4.8vw,60px)] leading-[1.03] font-semibold tracking-[-.02em]">
            Find scholarships
          </h1>
        </div>
        <p className="m-0 max-w-[460px] text-[15px] leading-[1.6] text-muted">
          Combine level, discipline and destination — for example, PhD + Engineering + Australia. Check your eligibility
          on each award.
        </p>
      </section>
      {/* The finder reads its filters from the URL on the client; the skeleton shows until then. */}
      <Suspense fallback={<FinderSkeleton />}>
        <Finder scholarships={scholarships} universities={universities} destinations={destinations} today={today} />
      </Suspense>
    </>
  );
}
