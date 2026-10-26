"use client";

import { toggleEligibility, useEligibility } from "@/lib/client/eligibility-store";

/** "Check your eligibility": a self-check with "I meet this" switches. Never a decision. */
export function EligibilityCheck({ id, items }: { id: string; items: string[] }) {
  const met = useEligibility(id);
  const count = met.filter((i) => i < items.length).length;
  return (
    <>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="eligibility-title" className="m-0 font-heading text-[22px] font-semibold">
          Check your eligibility
        </h2>
        <span aria-live="polite" className="text-[13px] font-semibold text-teal">
          {count} of {items.length} met
        </span>
      </div>
      <p className="m-0 mb-3.5 text-sm text-muted">A self-check, not a decision. The funder confirms eligibility.</p>
      <ul className="m-0 list-none p-0">
        {items.map((t, i) => {
          const on = met.includes(i);
          return (
            <li key={t} className="flex flex-wrap items-center justify-between gap-3.5 border-t border-border py-3">
              <span id={`elig-${i}`} className="flex-[1_1_260px] text-[15px] leading-normal text-pretty">
                {t}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-describedby={`elig-${i}`}
                onClick={() => toggleEligibility(id, i)}
                className={`flex min-h-11 items-center gap-2.5 rounded-pill border-[1.5px] py-0 pr-1.5 pl-4 text-[13px] font-semibold ${
                  on ? "border-teal bg-tint-bg text-tint-fg" : "border-border-input bg-surface text-ink"
                }`}
              >
                I meet this
                <span aria-hidden="true" className={`relative block h-[22px] w-9 rounded-pill ${on ? "bg-teal" : "bg-muted"}`}>
                  <span
                    className={`absolute top-[3px] block size-4 rounded-full bg-white transition-[left] duration-150 motion-reduce:transition-none ${
                      on ? "left-[17px]" : "left-[3px]"
                    }`}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
