import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CardGrid, ScholarshipCard } from "@/components/scholarship-card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Eyebrow, Panel, PanelHeader } from "@/components/ui/panel";
import { designUniversities } from "@/lib/content/design-data";
import { scholarshipsFor } from "@/lib/content/views";
import { getDestinations, getScholarships, getUniversity, getUniversities } from "@/lib/db/queries";
import { destinationHref, levelsText, scopeText, universityHref } from "@/lib/format";
import { RANK_ATTRIBUTION, RANK_TO_CONFIRM, rankLabel } from "@/lib/rank";
import { byDeadline } from "@/lib/status";
import { levels as allLevels } from "@/lib/taxonomy";
import { getToday } from "@/lib/today";

export function generateStaticParams() {
  return designUniversities().map((u) => ({ id: u.id }));
}

export async function generateMetadata({ params }: PageProps<"/universities/[id]">): Promise<Metadata> {
  const u = await getUniversity((await params).id);
  return u ? { title: u.name } : {};
}

export default async function UniversityPage({ params }: PageProps<"/universities/[id]">) {
  const { id } = await params;
  const u = await getUniversity(id);
  if (!u) notFound();
  const [scholarships, universities, destinations, today] = await Promise.all([
    getScholarships(),
    getUniversities(),
    getDestinations(),
    getToday(),
  ]);
  const country = destinations.find((d) => d.code === u.countryCode)?.name ?? u.countryCode;
  const sort = byDeadline(today);
  const { offered, national } = scholarshipsFor(u, scholarships);
  offered.sort(sort);
  national.sort(sort);
  const related = universities.filter((x) => x.countryCode === u.countryCode && x.id !== u.id).slice(0, 6);

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Destinations", href: "/destinations" },
          { label: country, href: destinationHref(u.countryCode) },
          { label: u.name },
        ]}
      />
      <section className="px-1 pt-[clamp(16px,3vw,32px)] pb-6">
        <div className="max-w-[820px]">
          <Eyebrow className="mb-3 text-teal">{u.city ? `${u.city}, ${country}` : country}</Eyebrow>
          <h1 className="m-0 font-heading text-[clamp(38px,5vw,62px)] leading-[1.03] font-semibold tracking-[-.02em]">{u.name}</h1>
        </div>
      </section>

      {/* The prototype pairs this card with a campus photo; none are licensed yet, and a country photo can show the wrong city. */}
      <section aria-label="Ranking and levels">
        <div className="flex flex-col gap-[18px] rounded-card-lg bg-surface p-[clamp(18px,2.6vw,30px)]">
          <div className="flex flex-wrap items-end gap-4">
            <p className="m-0 font-heading text-[clamp(48px,6vw,72px)] leading-none font-bold tracking-[-.02em]">
              {u.theRank ?? "To confirm"}
            </p>
            <p className="m-0 mb-2 max-w-[220px] text-[13px] text-muted">
              {u.theRank ? "THE World University Rankings 2027" : RANK_TO_CONFIRM}
            </p>
          </div>
          <div>
            <p className="m-0 mb-2 text-xs font-semibold uppercase tracking-[.06em] text-muted">Levels offered</p>
            {u.levels.length ? (
              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {allLevels
                  .filter((l) => u.levels.includes(l.code))
                  .map((l) => (
                    <li key={l.code} className="flex min-h-8 items-center rounded-pill bg-surface-4 px-3.5 text-[13px] font-semibold">
                      {l.name}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="m-0 text-sm text-muted">Not published</p>
            )}
          </div>
          <p className="mt-auto mb-0 text-xs text-muted">{RANK_ATTRIBUTION}</p>
        </div>
      </section>

      <Panel className="mt-4" labelledBy="uni-offered">
        <PanelHeader id="uni-offered" title="Offered by this university" className="mb-3.5" />
        {offered.length ? (
          <CardGrid>
            {offered.map((s) => (
              <ScholarshipCard key={s.id} s={s} today={today} eyebrow={scopeText(s)} />
            ))}
          </CardGrid>
        ) : (
          <p className="m-0 text-sm text-muted">
            No university-specific scholarships listed yet. National scholarships below can still be used here.
          </p>
        )}
      </Panel>

      <Panel className="mt-4" labelledBy="uni-national">
        <h2 id="uni-national" className="m-0 mb-1 font-heading text-2xl font-semibold">
          National scholarships you can use here
        </h2>
        <p className="m-0 mb-3.5 text-sm text-muted">
          Government and programme awards you can hold at {u.name}, if you meet their conditions.
        </p>
        {national.length ? (
          <CardGrid>
            {national.map((s) => (
              <ScholarshipCard key={s.id} s={s} today={today} eyebrow={`${s.funderType} · ${s.funder}`} />
            ))}
          </CardGrid>
        ) : (
          <p className="m-0 text-sm text-muted">No national scholarships listed for {country} yet.</p>
        )}
      </Panel>

      {related.length > 0 && (
        <Panel className="mt-4" labelledBy="uni-related">
          <h2 id="uni-related" className="m-0 mb-3.5 font-heading text-2xl font-semibold">
            Related universities in {country}
          </h2>
          <ul className="m-0 grid list-none gap-2 p-0 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
            {related.map((r) => (
              <li key={r.id}>
                <Link
                  href={universityHref(r.id)}
                  className="grid min-h-16 grid-cols-[88px_minmax(0,1fr)] items-center gap-2 rounded-bar border border-border bg-surface px-4 py-3 text-ink no-underline hover:border-navy hover:text-ink"
                >
                  <span className={`font-heading ${r.theRank ? "text-base font-bold" : "text-xs font-semibold text-muted"}`}>
                    {rankLabel(r)}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">{r.name}</span>
                    <span className="text-xs text-muted">{r.city ?? (r.levels.length ? levelsText(r.levels, true) : country)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3.5 mb-0 text-xs text-muted">{RANK_ATTRIBUTION}</p>
        </Panel>
      )}
    </>
  );
}
