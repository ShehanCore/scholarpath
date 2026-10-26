"use client";

import Link from "next/link";
import { useState } from "react";
import type { LevelCode } from "@/lib/content/types";

export type UniversityRow = {
  id: string;
  href: string;
  rank: string;
  ranked: boolean;
  name: string;
  city: string;
  scholarships: number;
  levelsText: string;
  /** Levels covered by scholarships usable at this university. */
  scholarshipLevels: LevelCode[];
};

const levelOptions: [LevelCode, string][] = [
  ["B", "Bachelor's"],
  ["M", "Master's"],
  ["R", "MPhil & Postgraduate"],
  ["P", "PhD"],
];

/** Universities in THE rank order, with the prototype's "All / Has scholarships for my level" filter. */
export function UniversityTable({ rows }: { rows: UniversityRow[] }) {
  const [mode, setMode] = useState<"all" | "mine">("all");
  const [level, setLevel] = useState<LevelCode>("M");
  const shown = mode === "all" ? rows : rows.filter((r) => r.scholarshipLevels.includes(level));

  const viewLink = (r: UniversityRow, extra = "") => (
    <Link
      href={r.href}
      aria-label={`View university: ${r.name}`}
      className={`inline-flex min-h-11 items-center rounded-pill border-[1.5px] border-ink bg-surface px-4 text-[11px] font-bold whitespace-nowrap uppercase tracking-[.05em] text-ink no-underline hover:bg-surface-4 hover:text-ink ${extra}`}
    >
      View university
    </Link>
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label="Filter universities" className="flex max-w-full rounded-[24px] bg-surface-4 p-1">
          {(
            [
              ["all", "All universities"],
              ["mine", "Has scholarships for my level"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={mode === k}
              onClick={() => setMode(k)}
              className={`min-h-11 rounded-[20px] border-0 px-4 text-[13px] leading-tight font-semibold sm:whitespace-nowrap ${
                mode === k ? "bg-navy text-white" : "bg-transparent text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {mode === "mine" && (
          <select
            aria-label="My level"
            value={level}
            onChange={(e) => setLevel(e.target.value as LevelCode)}
            className="min-h-12 rounded-pill border-[1.5px] border-ink bg-surface px-4 text-[13px] font-semibold text-ink"
          >
            {levelOptions.map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="my-4 text-sm text-muted">
          No listed universities have scholarships for this level yet. Switch to “All universities”.
        </p>
      ) : (
        <>
          <table className="hidden w-full border-collapse text-sm md:table">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[.06em] text-muted">
                <th scope="col" className="w-[150px] border-b border-border px-3 py-2.5">Rank</th>
                <th scope="col" className="border-b border-border px-3 py-2.5">University</th>
                <th scope="col" className="border-b border-border px-3 py-2.5">City</th>
                <th scope="col" className="border-b border-border px-3 py-2.5 text-right">Scholarships</th>
                <th scope="col" className="border-b border-border px-3 py-2.5">Levels offered</th>
                <th scope="col" className="border-b border-border px-3 py-2.5">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="hover:bg-surface-3">
                  <td className={`border-b border-border px-3 py-3.5 font-heading ${r.ranked ? "text-base font-bold" : "text-[13px] font-semibold text-muted"}`}>
                    {r.rank}
                  </td>
                  <th scope="row" className="border-b border-border px-3 py-3.5 text-left text-[15px] font-semibold">
                    {r.name}
                  </th>
                  <td className="border-b border-border px-3 py-3.5 text-muted">{r.city}</td>
                  <td className="border-b border-border px-3 py-3.5 text-right font-semibold">{r.scholarships}</td>
                  <td className="border-b border-border px-3 py-3.5 text-muted">{r.levelsText}</td>
                  <td className="border-b border-border px-3 py-2 text-right">{viewLink(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ol className="m-0 list-none p-0 md:hidden">
            {shown.map((r) => (
              <li key={r.id} className="grid grid-cols-[88px_minmax(0,1fr)] gap-2.5 border-t border-border py-3.5">
                <span className={`font-heading ${r.ranked ? "text-lg font-bold" : "text-[13px] font-semibold text-muted"}`}>{r.rank}</span>
                <div className="flex flex-col gap-1">
                  <span className="text-[15px] font-semibold">{r.name}</span>
                  <span className="text-[13px] text-muted">
                    {r.city} · {r.scholarships} scholarships
                  </span>
                  <span className="text-[13px] text-muted">{r.levelsText}</span>
                  {viewLink(r, "mt-1 self-start")}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </>
  );
}
