"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearCompare, toggleCompare, useCompare, useCompareNotice } from "@/lib/client/compare-store";
import type { Scholarship } from "@/lib/content/types";
import { deadlineView, levelsText, scholarshipHref } from "@/lib/format";
import { CloseButton, Dialog } from "./ui/dialog";

/**
 * Floating "n of 3 selected" bar and the compare drawer. Rows follow the prototype minus funding
 * (CLAUDE.md): funding is a link to the official website. Missing facts read "Not published".
 */
export function CompareBar({ scholarships, today }: { scholarships: Scholarship[]; today: string }) {
  const ids = useCompare();
  const notice = useCompareNotice();
  const [open, setOpen] = useState(false);
  // A notice shows for 2.8 s after it's raised.
  const [hiddenAt, setHiddenAt] = useState(0);
  const noticeText = notice.at > hiddenAt ? notice.text : "";
  const picked = ids.map((id) => scholarships.find((s) => s.id === id)).filter((s) => s !== undefined);

  useEffect(() => {
    if (!notice.at) return;
    const t = setTimeout(() => setHiddenAt(Date.now()), 2800);
    return () => clearTimeout(t);
  }, [notice]);

  const rows: [string, (s: Scholarship) => React.ReactNode][] = [
    ["Level", (s) => levelsText(s.levels)],
    ["Eligibility", (s) => (s.eligibility ? s.eligibility.join("; ") : "Not published")],
    [
      "Deadline",
      (s) => {
        const d = deadlineView(s, today);
        return `${d.closeText} · ${d.status}`;
      },
    ],
    ["Required documents", (s) => (s.documents ? s.documents.join(", ") : "Not published")],
    [
      "Funding",
      (s) => (
        <a href={s.officialUrl} target="_blank" rel="noopener">
          See funding details on the official website
        </a>
      ),
    ],
  ];

  return (
    <>
      <p role="status" className="sr-only">
        {noticeText}
      </p>
      {noticeText && (
        <div
          aria-hidden="true"
          className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-pill bg-ink px-5 py-3 text-[13px] font-semibold text-white shadow-dropdown"
        >
          {noticeText}
        </div>
      )}
      {picked.length > 0 && (
        <div
          data-noprint
          className="fixed right-4 bottom-4 z-[55] flex items-center gap-2.5 rounded-pill bg-navy py-1.5 pr-1.5 pl-[18px] text-white shadow-[0_10px_30px_color-mix(in_srgb,var(--color-navy)_30%,transparent)]"
        >
          <span className="text-[13px] font-semibold">{picked.length} of 3 selected</span>
          <button
            type="button"
            onClick={() => {
              clearCompare();
              setOpen(false);
            }}
            className="min-h-11 border-0 bg-transparent px-2.5 text-[11px] font-bold uppercase tracking-[.05em] text-on-dark-muted"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="min-h-11 rounded-pill border-0 bg-gold px-5 text-xs font-bold uppercase tracking-[.05em] text-on-gold hover:bg-gold-hover"
          >
            Compare
          </button>
        </div>
      )}
      <Dialog
        open={open && picked.length > 0}
        onClose={() => setOpen(false)}
        label="Compare scholarships"
        className="mx-auto mt-auto mb-0 max-h-[86vh] w-full max-w-[1240px] overflow-auto rounded-t-card-lg bg-surface p-[clamp(16px,2.4vw,28px)] text-ink"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="m-0 font-heading text-2xl font-semibold">Compare scholarships</h2>
          <CloseButton onClick={() => setOpen(false)} label="Close compare" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 150 + picked.length * 212 }}>
            <thead>
              <tr>
                <td className="w-[150px] border-b border-border pb-3.5" />
                {picked.map((s) => (
                  <th key={s.id} scope="col" className="border-b border-border px-1.5 pb-3.5 text-left align-top font-normal">
                    <span className="block font-heading text-[17px] leading-[1.25] font-semibold">{s.name}</span>
                    <span className="mt-2 flex gap-1.5">
                      <Link
                        href={scholarshipHref(s.id)}
                        onClick={() => setOpen(false)}
                        className="flex min-h-11 items-center rounded-pill bg-navy px-3.5 text-[11px] font-bold uppercase tracking-[.05em] text-white no-underline hover:text-white"
                      >
                        Details
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleCompare(s.id)}
                        aria-label={`Remove ${s.name} from compare`}
                        className="min-h-11 border-0 bg-transparent px-3 text-[11px] font-bold uppercase tracking-[.05em] text-muted"
                      >
                        Remove
                      </button>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, cell]) => (
                <tr key={label}>
                  <th scope="row" className="border-b border-border py-3.5 pr-3 text-left align-top text-xs font-semibold uppercase tracking-[.06em] text-muted">
                    {label}
                  </th>
                  {picked.map((s) => (
                    <td key={s.id} className="border-b border-border px-1.5 py-3.5 align-top text-sm leading-normal">
                      {cell(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3.5 mb-0 text-xs text-muted">Verify each scholarship on its official website.</p>
      </Dialog>
    </>
  );
}
