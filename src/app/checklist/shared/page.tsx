import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/panel";
import { getScholarships } from "@/lib/db/queries";
import { getToday } from "@/lib/today";
import { SharedSummary } from "./shared-summary";

export const metadata: Metadata = { title: "Shared readiness summary", robots: { index: false, follow: false } };

export default async function SharedChecklistPage() {
  const [scholarships, today] = await Promise.all([getScholarships(), getToday()]);
  return (
    <>
      <section className="px-1 pt-[clamp(24px,4vw,48px)] pb-2">
        <Eyebrow className="mb-3 text-teal">Shared with you · read-only</Eyebrow>
        <h1 className="m-0 font-heading text-[clamp(36px,4.8vw,60px)] leading-[1.03] font-semibold tracking-[-.02em]">Readiness summary</h1>
      </section>
      <SharedSummary scholarships={scholarships} today={today} />
    </>
  );
}
