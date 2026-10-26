"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CompareBar } from "@/components/compare-bar";
import { CardGrid, ScholarshipCard } from "@/components/scholarship-card";
import { CloseButton, Dialog } from "@/components/ui/dialog";
import type { Destination, Scholarship, University } from "@/lib/content/types";
import {
  AWARD_TYPES,
  DEADLINE_RANGES,
  SORTS,
  activeChips,
  applyFilters,
  blankFilters,
  filtersToQuery,
  parseFilters,
  toggle,
  type FinderFilters,
  type FinderSort,
} from "@/lib/finder";
import { plural } from "@/lib/format";
import { disciplines, levels } from "@/lib/taxonomy";

type Props = { scholarships: Scholarship[]; universities: University[]; destinations: Destination[]; today: string };

/**
 * The finder. Filter state lives in the URL: changes go through history.pushState, which Next keeps in
 * sync with useSearchParams without a server round trip, so filtering is instant and Back undoes it.
 */
export function Finder({ scholarships, universities, destinations, today }: Props) {
  const params = useSearchParams();
  const f = parseFilters(params);
  const [sheetOpen, setSheetOpen] = useState(false);

  const set = (next: FinderFilters) => {
    window.history.pushState(null, "", `${window.location.pathname}${filtersToQuery(next)}`);
  };

  const results = applyFilters(scholarships, universities, f, today);
  const destName = Object.fromEntries(destinations.map((d) => [d.code, d.name]));
  const chips = activeChips(f, {
    destinations: destName,
    universities: Object.fromEntries(universities.map((u) => [u.id, u.name])),
  });
  const count = plural(results.length, "scholarship");

  const panel = (
    <FilterPanel f={f} set={set} universities={universities} destinations={destinations} idPrefix={sheetOpen ? "sheet" : "side"} />
  );

  return (
    <>
      <div className="grid items-start gap-4 md:grid-cols-[290px_minmax(0,1fr)]">
        <aside aria-labelledby="filters-side" className="hidden rounded-card bg-surface px-5 py-[18px] md:block">
          <div className="mb-1.5 flex items-center justify-between">
            <h2 id="filters-side" className="m-0 font-heading text-[19px] font-semibold">
              Filters
            </h2>
            <ResetButton onClick={() => set({ ...blankFilters, sort: f.sort })} />
          </div>
          {!sheetOpen && panel}
        </aside>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-[22px] bg-surface px-3.5 py-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="min-h-11 rounded-pill border-0 bg-navy px-[18px] text-xs font-bold uppercase tracking-[.05em] text-white md:hidden"
              >
                Filters{chips.length ? ` (${chips.length})` : ""}
              </button>
              <p role="status" className="mx-1.5 my-0 text-[15px] font-semibold">
                {count}
              </p>
            </div>
            <label className="flex items-center gap-2 text-[13px] text-muted">
              Sort by
              <select
                value={f.sort}
                onChange={(e) => set({ ...f, sort: e.target.value as FinderSort })}
                className="min-h-11 rounded-pill border-[1.5px] border-ink bg-surface px-3.5 text-[13px] font-semibold text-ink"
              >
                {SORTS.map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {chips.length > 0 && (
            <ul aria-label="Active filters" className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
              {chips.map((c) => (
                <li key={c.label}>
                  <button
                    type="button"
                    onClick={() => set(c.remove(f))}
                    aria-label={`Remove filter ${c.label}`}
                    className="flex min-h-11 items-center gap-2 rounded-pill border-0 bg-surface py-0 pr-2 pl-3.5 text-[13px] font-semibold text-ink hover:bg-disabled"
                  >
                    {c.label}
                    <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-full bg-surface-4 text-sm">
                      ×
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => set({ ...blankFilters, sort: f.sort })}
                  className="min-h-11 border-0 bg-transparent px-2.5 text-xs font-bold uppercase tracking-[.05em] text-teal"
                >
                  Clear all
                </button>
              </li>
            </ul>
          )}

          {scholarships.length === 0 ? (
            <EmptyState />
          ) : results.length === 0 ? (
            <section aria-labelledby="no-results" className="flex flex-col items-start gap-3.5 rounded-card bg-surface p-[clamp(28px,5vw,56px)]">
              <h2 id="no-results" className="m-0 max-w-[560px] font-heading text-[28px] leading-[1.15] font-semibold">
                No scholarships match all of these filters
              </h2>
              <p className="m-0 max-w-[560px] text-[15px] leading-[1.6] text-muted">
                Try removing a filter. Destination and deadline range narrow results the most. Many government awards are
                open to all disciplines.
              </p>
              <div className="flex flex-wrap gap-2">
                {chips.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => set(c.remove(f))}
                    className="min-h-11 rounded-pill border-[1.5px] border-border-input bg-surface px-4 text-[13px] font-semibold"
                  >
                    Remove “{c.label}”
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => set({ ...blankFilters, sort: f.sort })}
                className="min-h-12 rounded-pill border-0 bg-gold px-[22px] text-xs font-bold uppercase tracking-[.05em] text-on-gold hover:bg-gold-hover"
              >
                Clear all filters
              </button>
            </section>
          ) : (
            <>
              <h2 className="sr-only">Results</h2>
              <CardGrid>
                {results.map((s) => (
                  <ScholarshipCard
                    key={s.id}
                    s={s}
                    today={today}
                    eyebrow={`${destName[s.destinationCode] ?? s.destinationCode} · ${s.funderType}`}
                    funder="name"
                    actions={["compare", "save"]}
                    surface="plain"
                  />
                ))}
              </CardGrid>
              <p className="mx-1 mt-1 mb-0 text-xs text-muted">Closed scholarships stay listed, muted, at the end.</p>
            </>
          )}
        </div>
      </div>

      <Dialog
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        label="Filters"
        className="mx-0 mt-auto mb-0 max-h-[88vh] w-full max-w-full flex-col rounded-t-card-lg bg-surface p-0 text-ink open:flex"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="m-0 font-heading text-[22px] font-semibold">Filters</h2>
          <div className="flex gap-1">
            <ResetButton onClick={() => set({ ...blankFilters, sort: f.sort })} />
            <CloseButton onClick={() => setSheetOpen(false)} label="Close filters" />
          </div>
        </div>
        <div className="overflow-auto px-5">{sheetOpen && panel}</div>
        <div className="border-t border-border px-5 pt-3 pb-5">
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            className="min-h-[52px] w-full rounded-pill border-0 bg-gold text-[13px] font-bold uppercase tracking-[.05em] text-on-gold"
          >
            Show {results.length} results
          </button>
        </div>
      </Dialog>

      <CompareBar scholarships={scholarships} today={today} />
    </>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 border-0 bg-transparent px-2.5 text-xs font-bold uppercase tracking-[.05em] text-teal"
    >
      Reset
    </button>
  );
}

type GroupKey = "lv" | "disc" | "dest" | "aw";

function FilterPanel({
  f,
  set,
  universities,
  destinations,
  idPrefix,
}: {
  f: FinderFilters;
  set: (f: FinderFilters) => void;
  universities: University[];
  destinations: Destination[];
  idPrefix: string;
}) {
  // Level and award type start open, as in the prototype.
  const [open, setOpen] = useState<Record<GroupKey, boolean>>({ lv: true, disc: false, dest: false, aw: true });
  const groups: { key: GroupKey; title: string; options: [string, string][] }[] = [
    { key: "lv", title: "Study level", options: levels.map((l) => [l.code, l.name]) },
    { key: "disc", title: "Discipline", options: disciplines.map((d) => [d.slug, d.name]) },
    { key: "dest", title: "Destination", options: destinations.map((d) => [d.code, d.name]) },
    { key: "aw", title: "Award type", options: AWARD_TYPES.map((a) => [a, a]) },
  ];
  const selectClass =
    "min-h-12 rounded-segment border-[1.5px] border-border-input bg-surface px-3 text-sm font-medium tracking-normal normal-case text-ink";
  const labelClass = "flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[.06em]";

  return (
    <>
      {groups.map((g) => {
        const selected = f[g.key] as string[];
        const isOpen = open[g.key];
        const regionId = `${idPrefix}-${g.key}`;
        return (
          <div key={g.key} className="border-t border-border py-2">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={regionId}
              onClick={() => setOpen({ ...open, [g.key]: !isOpen })}
              className="flex min-h-11 w-full items-center justify-between border-0 bg-transparent p-0 text-xs font-semibold uppercase tracking-[.06em] text-ink"
            >
              <span>{g.title}</span>
              <span className="font-mono text-xs font-medium normal-case text-muted">
                {selected.length ? `${selected.length} selected` : isOpen ? "−" : "+"}
              </span>
            </button>
            <div id={regionId} role="group" aria-label={g.title} hidden={!isOpen} className="flex flex-wrap gap-1.5 pt-1 pb-2">
              {g.options.map(([v, label]) => {
                const on = selected.includes(v);
                return (
                  <button
                    key={v}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => set({ ...f, [g.key]: toggle(selected, v) })}
                    className={`min-h-11 rounded-pill border-[1.5px] px-3.5 text-left text-[13px] font-semibold ${
                      on ? "border-navy bg-navy text-white" : "border-border-input bg-surface text-ink hover:bg-surface-4"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="flex flex-col gap-3.5 border-t border-border pt-3.5 pb-1">
        <label className={labelClass}>
          University
          <select value={f.uni} onChange={(e) => set({ ...f, uni: e.target.value })} className={selectClass}>
            <option value="">Any university</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.countryCode})
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Deadline range
          <select value={f.dl} onChange={(e) => set({ ...f, dl: e.target.value })} className={selectClass}>
            {DEADLINE_RANGES.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <section aria-labelledby="finder-empty" className="flex flex-col items-start gap-3.5 rounded-card bg-surface p-[clamp(28px,5vw,56px)]">
      <h2 id="finder-empty" className="m-0 max-w-[520px] font-heading text-[28px] leading-[1.15] font-semibold">
        Start with what you want to study
      </h2>
      <p className="m-0 max-w-[520px] text-[15px] leading-[1.6] text-muted">
        Pick a level, discipline or destination on the left — or browse one of these popular starting points.
      </p>
      <div className="flex flex-wrap gap-2">
        {[
          ["/", "Browse from home"],
          ["/destinations", "All destinations"],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-11 items-center rounded-pill border-[1.5px] border-ink bg-surface px-[18px] text-xs font-bold uppercase tracking-[.05em] text-ink no-underline hover:text-ink"
          >
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Shown while the finder hydrates (it reads the URL on the client). */
export function FinderSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading results" className="grid gap-4 md:grid-cols-[290px_minmax(0,1fr)]">
      <div className="hidden h-[420px] rounded-card bg-surface md:block" />
      <div className="flex flex-col gap-3">
        <div className="h-[68px] rounded-[22px] bg-surface" />
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr))]">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="flex flex-col gap-3 rounded-[22px] bg-surface p-5">
              <div className="h-3 w-2/5 rounded-[6px] bg-page" />
              <div className="h-[22px] w-4/5 rounded-[6px] bg-page" />
              <div className="h-3 w-[55%] rounded-[6px] bg-page" />
              <div className="flex gap-1.5">
                <div className="h-[30px] w-[90px] rounded-pill bg-page" />
                <div className="h-[30px] w-[110px] rounded-pill bg-page" />
              </div>
              <div className="mt-2 h-11 border-t border-border" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
