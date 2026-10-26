"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

export type BrowseKey = "disc" | "level" | "dest" | "uni";
export type ChooserList = {
  label: string;
  count: string;
  tileSub: string;
  title: string;
  note: string;
  items: { label: string; sub: string; href: string }[];
  more?: { label: string; href: string };
};
export type ChooserLists = Record<BrowseKey, ChooserList>;
const KEYS: BrowseKey[] = ["disc", "level", "dest", "uni"];

function ChooserGrid({ list, headingSize }: { list: ChooserList; headingSize: string }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <h3 className={`m-0 font-heading font-semibold ${headingSize}`}>{list.title}</h3>
        {list.note && <span className="text-[13px] text-muted">{list.note}</span>}
      </div>
      <ul className="m-0 grid list-none gap-2 p-0 [grid-template-columns:repeat(auto-fill,minmax(min(100%,230px),1fr))]">
        {list.items.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="flex min-h-[60px] flex-col justify-center gap-0.5 rounded-bar border border-border bg-surface px-4 py-2.5 text-ink no-underline hover:border-navy hover:bg-surface-3 hover:text-ink"
            >
              <span className="text-sm font-semibold">{c.label}</span>
              <span className="text-xs text-muted">{c.sub}</span>
            </Link>
          </li>
        ))}
      </ul>
      {list.more && (
        <Link
          href={list.more.href}
          className="mt-3 inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-[.05em] no-underline"
        >
          {list.more.label}
        </Link>
      )}
    </div>
  );
}

/** Layout A: "Browse by" list on the left switches the chooser under the featured carousel. */
export function BrowseA({
  lists,
  quickFilters,
  featured,
}: {
  lists: ChooserLists;
  quickFilters: { label: string; href: string }[];
  featured: ReactNode;
}) {
  const [key, setKey] = useState<BrowseKey>("disc");
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[230px_minmax(0,1fr)]">
      <aside>
        <p className="m-0 mb-2.5 text-xs font-semibold uppercase tracking-[.06em] text-muted">Browse by</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col">
          {KEYS.map((k) => {
            const on = k === key;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => setKey(k)}
                className={`flex min-h-11 items-center justify-between gap-3 rounded-segment border-0 px-4 text-left text-[13px] font-semibold uppercase tracking-[.04em] whitespace-nowrap ${
                  on ? "bg-navy text-white" : "bg-transparent text-ink hover:bg-surface-4"
                }`}
              >
                <span>{lists[k].label}</span>
                <span className="font-mono text-xs font-medium opacity-80">{lists[k].count}</span>
              </button>
            );
          })}
        </div>
        <div className="hidden md:block">
          <p className="m-0 mt-6 mb-2.5 text-xs font-semibold uppercase tracking-[.06em] text-muted">Quick filters</p>
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {quickFilters.map((f) => (
              <li key={f.href}>
                <Link
                  href={f.href}
                  className="flex min-h-11 items-center rounded-segment px-4 text-[13px] font-semibold uppercase tracking-[.04em] text-ink no-underline hover:bg-surface-4 hover:text-ink"
                >
                  {f.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col gap-5">
        {featured}
        <ChooserGrid list={lists[key]} headingSize="text-[19px]" />
      </div>
    </div>
  );
}

/** Layout B: four entry tiles; each opens its chooser below. */
export function BrowseB({ lists }: { lists: ChooserLists }) {
  const [key, setKey] = useState<BrowseKey | null>(null);
  return (
    <>
      <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
        {KEYS.map((k, i) => {
          const on = k === key;
          return (
            <button
              key={k}
              type="button"
              aria-expanded={on}
              aria-controls="home-b-chooser"
              onClick={() => setKey(on ? null : k)}
              className={`flex min-h-[150px] flex-col justify-between gap-4 rounded-card border-2 bg-surface p-[22px] text-left hover:border-navy ${
                on ? "border-navy" : "border-surface"
              }`}
            >
              <span className="font-mono text-xs font-medium text-muted">0{i + 1}</span>
              <span className="flex flex-col gap-1">
                <span className="font-heading text-2xl font-semibold text-ink">{lists[k].label}</span>
                <span className="text-[13px] text-muted">{lists[k].tileSub}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div id="home-b-chooser">
        {key && (
          <section className="mt-3 rounded-card bg-surface p-[clamp(16px,2.4vw,28px)]">
            <ChooserGrid list={lists[key]} headingSize="text-xl" />
          </section>
        )}
      </div>
    </>
  );
}
