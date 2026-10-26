import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { destinationImage } from "@/components/destination-card";
import { CardGrid, ScholarshipCard } from "@/components/scholarship-card";
import { UniversityTable } from "@/components/university-table";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { destinationStats } from "@/lib/content/derive";
import { universityRow, withArticle } from "@/lib/content/views";
import { designDestinations } from "@/lib/content/design-data";
import { getDestinations, getScholarships, getUniversities } from "@/lib/db/queries";
import { destinationChip, formatDate, scopeText } from "@/lib/format";
import { RANK_ATTRIBUTION } from "@/lib/rank";
import { byDeadline } from "@/lib/status";
import { getToday } from "@/lib/today";

// Hero copy from the prototype; other destinations use their one-line "why".
const intros: Record<string, string> = {
  GB: "One-year taught master's degrees, a post-study work route and some of the world's most-applied-for government scholarships.",
};

export function generateStaticParams() {
  return designDestinations().map((d) => ({ code: d.code.toLowerCase() }));
}

async function load(code: string) {
  const destinations = await getDestinations();
  return destinations.find((d) => d.code === code.toUpperCase()) ?? null;
}

export async function generateMetadata({ params }: PageProps<"/destinations/[code]">): Promise<Metadata> {
  const d = await load((await params).code);
  return d ? { title: `Study in ${withArticle(d.name)}`, description: d.why } : {};
}

export default async function DestinationPage({ params }: PageProps<"/destinations/[code]">) {
  const { code } = await params;
  const d = await load(code);
  if (!d) notFound();
  const [scholarships, universities, today] = await Promise.all([getScholarships(), getUniversities(), getToday()]);
  const stats = destinationStats(d, scholarships, universities, today);
  const here = scholarships.filter((s) => s.destinationCode === d.code).sort(byDeadline(today));
  const unis = universities.filter((u) => u.countryCode === d.code);
  const europe = d.code === "EU";
  const place = europe ? "Europe-wide programmes" : withArticle(d.name);

  return (
    <>
      <Breadcrumb items={[{ label: "Destinations", href: "/destinations" }, { label: d.name }]} />
      <section className="grid items-end gap-6 px-1 pt-[clamp(16px,3vw,32px)] pb-[clamp(20px,3vw,32px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
        <div>
          <span className="mb-3.5 inline-flex h-[26px] items-center rounded-[6px] bg-surface px-2 font-mono text-xs font-medium">
            {destinationChip(d.code)}
          </span>
          <h1 className="m-0 font-heading text-[clamp(40px,5.4vw,68px)] leading-[1.02] font-semibold tracking-[-.02em]">
            {europe ? d.name : `Study in ${withArticle(d.name)}`}
          </h1>
        </div>
        <p className="m-0 max-w-[480px] text-base leading-[1.6] text-muted">{intros[d.code] ?? d.why}</p>
      </section>

      <section aria-label="Key numbers" className="relative flex min-h-[300px] items-end overflow-hidden rounded-card-lg bg-navy">
        <Image src={destinationImage(d.code)} alt="" fill priority sizes="(min-width: 1380px) 1316px, 100vw" className="object-cover" />
        <div className="relative m-[clamp(12px,2vw,20px)] grid w-full max-w-[820px] gap-1 rounded-card-md bg-surface p-1.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))]">
          {[
            [String(stats.openScholarships), "open scholarships"],
            [europe ? "—" : String(stats.rankedUniversities), "THE-ranked universities listed"],
            [stats.nextDeadline ? formatDate(stats.nextDeadline) : "None listed", "next closing deadline"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-segment bg-surface-2 px-4 py-3.5">
              <p className="m-0 font-heading text-[26px] font-bold">{v}</p>
              <p className="mt-0.5 mb-0 text-[13px] text-muted">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <Panel className="mt-4" labelledBy="dest-scholarships">
        <PanelHeader id="dest-scholarships" title={`Scholarships for ${place}`} className="mb-1.5" />
        <p className="m-0 mb-4 text-sm text-muted">
          National scholarships can be used at many universities. University scholarships belong to one.
        </p>
        {here.length ? (
          <CardGrid min={320}>
            {here.map((s) => (
              <ScholarshipCard key={s.id} s={s} today={today} eyebrow={scopeText(s)} funder="full" />
            ))}
          </CardGrid>
        ) : (
          <p className="m-0 text-sm text-muted">No scholarships listed for {place} yet.</p>
        )}
      </Panel>

      {!europe && (
        <Panel className="mt-4" labelledBy="dest-universities">
          <h2 id="dest-universities" className="m-0 mb-1 font-heading text-2xl font-semibold">
            Universities, ranked by THE
          </h2>
          <p className="m-0 mb-4 text-sm text-muted">Ascending order of World University Rankings 2027 position.</p>
          {unis.length ? (
            <UniversityTable rows={unis.map((u) => universityRow(u, scholarships))} />
          ) : (
            <p className="m-0 text-sm text-muted">No universities listed for {withArticle(d.name)} yet.</p>
          )}
          <p className="mt-4 mb-0 text-xs text-muted">{RANK_ATTRIBUTION}</p>
        </Panel>
      )}
    </>
  );
}
