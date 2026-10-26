"use client";

import Link from "next/link";
import { useState } from "react";
import { checklistStats, needsWork, type Checklist } from "@/lib/checklist";
import type { Scholarship } from "@/lib/content/types";
import { daysLeft } from "@/lib/status";
import { formatDate } from "@/lib/verification";
import { QualityBars } from "./parts";

/** Readiness summary: overall %, five bars, deadline, actions and everything marked "Needs work". */
export function Summary({
  title,
  checklist,
  linked,
  today,
  onRevisit,
  shareUrl,
}: {
  title: string;
  checklist: Checklist;
  linked: Scholarship | null;
  today: string;
  /** Omitted on the read-only shared view. */
  onRevisit?: (itemId: string, sectionIndex: number) => void;
  /** Builds the read-only link; omitted on the shared view. */
  shareUrl?: () => string;
}) {
  const st = checklistStats(checklist);
  const needs = needsWork(checklist);
  const dl = linked ? daysLeft(linked.closes, today) : null;
  const [shareMsg, setShareMsg] = useState<{ text: string; url?: string } | null>(null);

  const share = async () => {
    if (!shareUrl) return;
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg({ text: "Share link copied. Your mentor sees a read-only summary, including your notes." });
    } catch {
      setShareMsg({ text: "Copy this link for your mentor. They see a read-only summary, including your notes.", url });
    }
  };

  return (
    <>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
        <section aria-labelledby="summary-title" className="rounded-card-lg bg-surface p-[clamp(18px,2.6vw,32px)]">
          <h2 id="summary-title" className="m-0 mb-1 text-sm font-normal text-muted">
            {title}
          </h2>
          <div className="mb-1.5 flex flex-wrap items-baseline gap-3">
            <span className="font-heading text-[clamp(56px,7vw,84px)] leading-none font-bold tracking-[-.03em]">{st.pct}%</span>
            <span className="text-base font-semibold text-muted">ready</span>
          </div>
          <p className="m-0 mb-[22px] text-sm text-muted">
            {st.answered} of {st.total} items answered · {st.needs} need work
          </p>
          <QualityBars bars={st.bars} size="lg" barClass="bg-navy" />
        </section>
        <div className="flex flex-col gap-4">
          <section aria-label="Deadline" className="flex flex-col gap-3.5 rounded-card-lg bg-navy p-[clamp(18px,2.6vw,32px)] text-white">
            <p className="m-0 text-xs font-semibold uppercase tracking-[.06em] text-gold-on-dark">Deadline</p>
            <p className="m-0 font-heading text-[44px] leading-none font-bold">
              {dl === null ? "—" : dl >= 0 ? `${dl} days left` : "Closed"}
            </p>
            <p className="m-0 text-sm text-on-dark-muted">
              {linked
                ? `Closes ${formatDate(linked.closes)} · verify on the official website`
                : "Link a scholarship in Setup to track its deadline."}
            </p>
            <div data-noprint className="mt-1.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-12 rounded-pill border-0 bg-gold px-5 text-xs font-bold uppercase tracking-[.05em] text-on-gold hover:bg-gold-hover"
              >
                Download PDF / Print
              </button>
              {shareUrl && (
                <button
                  type="button"
                  onClick={share}
                  className="min-h-12 rounded-pill border border-white/50 bg-transparent px-5 text-xs font-bold uppercase tracking-[.05em] text-white hover:bg-white/10"
                >
                  Share with mentor
                </button>
              )}
              <Link
                href="/adviser"
                className="flex min-h-12 items-center rounded-pill border border-white/50 px-5 text-xs font-bold uppercase tracking-[.05em] text-white no-underline hover:bg-white/10 hover:text-white"
              >
                Book an application review
              </Link>
            </div>
            <div role="status" data-noprint className="text-sm text-on-dark-muted empty:hidden">
              {shareMsg && (
                <>
                  <p className="m-0">{shareMsg.text}</p>
                  {shareMsg.url && (
                    <input
                      readOnly
                      aria-label="Share link"
                      value={shareMsg.url}
                      onFocus={(e) => e.currentTarget.select()}
                      className="mt-2 min-h-11 w-full rounded-input border-0 bg-surface px-3 font-mono text-xs text-ink"
                    />
                  )}
                </>
              )}
            </div>
          </section>
          <section className="rounded-card bg-warning-bg px-[22px] py-5">
            <p className="m-0 font-heading text-base leading-[1.45] font-semibold text-warning-fg">
              A high GPA alone doesn&apos;t guarantee success. Prioritise fit, evidence, clarity, feasibility and impact.
            </p>
          </section>
        </div>
      </div>
      <section aria-labelledby="needs-title" className="mt-4 rounded-card-lg bg-surface p-[clamp(18px,2.6vw,32px)]">
        <h2 id="needs-title" className="m-0 mb-1 font-heading text-[22px] font-semibold">
          Needs work
        </h2>
        <p className="m-0 mb-3 text-sm text-muted">
          {needs.length ? `${needs.length} items marked “Needs work”.` : "Nothing marked “Needs work” yet."}
        </p>
        <ul className="m-0 list-none p-0">
          {needs.map((n) => (
            <li key={n.id} className="flex flex-wrap items-start justify-between gap-3 border-t border-border py-3.5">
              <div className="flex flex-[1_1_320px] flex-col gap-1">
                <span className="font-mono text-xs font-medium text-muted">{n.where}</span>
                <span className="text-[15px] leading-normal">{n.text}</span>
                {n.note && <span className="text-[13px] text-muted">Note: {n.note}</span>}
              </div>
              {onRevisit && (
                <button
                  type="button"
                  data-noprint
                  onClick={() => onRevisit(n.id, n.sectionIndex)}
                  aria-label={`Revisit: ${n.text}`}
                  className="min-h-11 rounded-pill border-[1.5px] border-ink bg-surface px-4 text-[11px] font-bold uppercase tracking-[.05em]"
                >
                  Revisit
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
