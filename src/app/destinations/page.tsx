import type { Metadata } from "next";
import { DestinationCard } from "@/components/destination-card";
import { Eyebrow, Panel } from "@/components/ui/panel";
import { destinationStats } from "@/lib/content/derive";
import { getDestinations, getScholarships, getUniversities } from "@/lib/db/queries";
import { getToday } from "@/lib/today";

export const metadata: Metadata = {
  title: "Destinations",
  description: "18 destinations, each with its national scholarships and universities ranked by THE.",
};

export default async function DestinationsPage() {
  const [destinations, scholarships, universities, today] = await Promise.all([
    getDestinations(),
    getScholarships(),
    getUniversities(),
    getToday(),
  ]);
  return (
    <>
      <section className="grid items-end gap-5 px-1 pt-[clamp(24px,4vw,48px)] pb-[clamp(16px,3vw,28px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
        <div>
          <Eyebrow className="mb-3 text-teal">Destinations</Eyebrow>
          <h1 className="m-0 font-heading text-[clamp(36px,4.8vw,60px)] leading-[1.03] font-semibold tracking-[-.02em]">
            Where do you want to study?
          </h1>
        </div>
        <p className="m-0 max-w-[460px] text-[15px] leading-[1.6] text-muted">
          {destinations.length} destinations, each with its national scholarships and universities ranked by THE.
        </p>
      </section>
      <Panel as="div">
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,290px),1fr))]">
          {destinations.map((d, i) => (
            <DestinationCard
              key={d.code}
              d={d}
              index={i}
              headingLevel={2}
              priority={i < 3}
              stats={destinationStats(d, scholarships, universities, today)}
            />
          ))}
        </div>
      </Panel>
    </>
  );
}
