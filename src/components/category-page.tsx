import Link from "next/link";
import { CompareBar } from "@/components/compare-bar";
import { CardGrid, ScholarshipCard } from "@/components/scholarship-card";
import { Eyebrow, Panel, PanelHeader } from "@/components/ui/panel";
import type { Destination, Scholarship } from "@/lib/content/types";
import { destinationChip, destinationHref, plural } from "@/lib/format";
import { byDeadline, statusOf } from "@/lib/status";

/** Shared template for discipline and study-level pages (prototype `cat`). */
export function CategoryPage({
  kind,
  title,
  sub,
  intro,
  tabs,
  scholarships,
  allScholarships,
  destinations,
  today,
  finderHref,
}: {
  kind: "Discipline" | "Study level";
  title: string;
  sub: string;
  intro: string;
  tabs: { label: string; href: string; current: boolean }[];
  /** Scholarships matching this category. */
  scholarships: Scholarship[];
  /** Every scholarship, so the compare drawer can show picks made on other pages. */
  allScholarships: Scholarship[];
  destinations: Destination[];
  today: string;
  finderHref: string;
}) {
  const live = scholarships.filter((s) => statusOf(s, today) !== "Closed").sort(byDeadline(today));
  const counts = new Map<string, number>();
  for (const s of scholarships) counts.set(s.destinationCode, (counts.get(s.destinationCode) ?? 0) + 1);
  const topDest = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const destName = (code: string) => destinations.find((d) => d.code === code)?.name ?? code;

  const stats: [number, string][] = [
    [scholarships.length, "scholarships"],
    kind === "Discipline"
      ? [scholarships.filter((s) => !s.disciplinesAll).length, "subject-specific"]
      : [counts.size, "destinations"],
    [scholarships.filter((s) => statusOf(s, today) === "Closing soon").length, "closing within 30 days"],
  ];

  return (
    <>
      <section className="grid items-end gap-5 px-1 pt-[clamp(24px,4vw,48px)] pb-[18px] [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
        <div>
          <Eyebrow className="mb-3 text-teal">
            {kind} · {sub}
          </Eyebrow>
          <h1 className="m-0 font-heading text-[clamp(36px,4.8vw,60px)] leading-[1.03] font-semibold tracking-[-.02em]">{title}</h1>
        </div>
        <p className="m-0 max-w-[480px] text-[15px] leading-[1.6] text-muted">{intro}</p>
      </section>

      <nav aria-label={kind === "Discipline" ? "Disciplines" : "Study levels"} className="mb-3">
        <ul className="m-0 flex list-none gap-1.5 overflow-x-auto p-0 pb-1.5">
          {tabs.map((t) => (
            <li key={t.href} className="shrink-0">
              <Link
                href={t.href}
                aria-current={t.current ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-pill px-4 text-[13px] font-semibold whitespace-nowrap no-underline ${
                  t.current ? "bg-navy text-white hover:text-white" : "bg-surface text-ink hover:bg-surface-4 hover:text-ink"
                }`}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-label="Key numbers" className="grid gap-1 rounded-card bg-surface p-1.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))]">
        {stats.map(([v, l]) => (
          <div key={l} className="rounded-card-sm bg-surface-2 px-[18px] py-4">
            <p className="m-0 font-heading text-[30px] font-bold">{v}</p>
            <p className="mt-0.5 mb-0 text-[13px] text-muted">{l}</p>
          </div>
        ))}
      </section>

      <Panel className="mt-4" labelledBy="cat-scholarships">
        <PanelHeader
          id="cat-scholarships"
          title={`Scholarships for ${title}`}
          className="mb-3.5 items-center"
          aside={
            <Link
              href={finderHref}
              className="flex min-h-11 items-center rounded-pill border-[1.5px] border-ink bg-surface px-[18px] text-xs font-bold uppercase tracking-[.05em] text-ink no-underline hover:bg-surface-4 hover:text-ink"
            >
              See all {scholarships.length} in the finder
            </Link>
          }
        />
        {live.length ? (
          <CardGrid>
            {live.slice(0, 6).map((s) => (
              <ScholarshipCard
                key={s.id}
                s={s}
                today={today}
                eyebrow={`${destName(s.destinationCode)} · ${s.funderType}`}
                disciplineStyle={kind === "Discipline" ? "navy" : "plain"}
                actions={["compare"]}
              />
            ))}
          </CardGrid>
        ) : (
          <p className="m-0 text-sm text-muted">No open scholarships listed for {title} right now.</p>
        )}
      </Panel>

      {topDest.length > 0 && (
        <Panel className="mt-4" labelledBy="cat-destinations">
          <h2 id="cat-destinations" className="m-0 mb-3.5 font-heading text-2xl font-semibold">
            Top destinations for {title}
          </h2>
          <ul className="m-0 grid list-none gap-2 p-0 [grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr))]">
            {topDest.map(([code, n]) => (
              <li key={code}>
                <Link
                  href={destinationHref(code)}
                  className="flex min-h-[72px] items-center gap-3 rounded-card-sm border border-border bg-surface px-4 py-3.5 text-ink no-underline hover:border-navy hover:text-ink"
                >
                  <span className="flex h-[26px] items-center rounded-[6px] bg-surface-4 px-2 font-mono text-[11px] font-medium">
                    {destinationChip(code)}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[15px] font-semibold">{destName(code)}</span>
                    <span className="text-xs text-muted">{plural(n, "scholarship")}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <CompareBar scholarships={allScholarships} today={today} />
    </>
  );
}
