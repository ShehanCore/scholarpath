"use client";

import Link from "next/link";
import { useState } from "react";
import { CompareBar } from "@/components/compare-bar";
import { CompareButton } from "@/components/compare-button";
import { NotifyButton } from "@/components/notify-button";
import { WriteEmailDialog, type EmailPreset, type EmailUniversity } from "@/components/outreach/write-email";
import { StatusChip } from "@/components/ui/status-chip";
import { checklistStats } from "@/lib/checklist";
import { useAllChecklists } from "@/lib/client/checklist-store";
import { setOutreachStatus, useOutreach } from "@/lib/client/outreach-store";
import { toggleSaved, useSaved } from "@/lib/client/saved-store";
import type { Scholarship } from "@/lib/content/types";
import { deadlineView, levelsText, scholarshipHref } from "@/lib/format";
import { recipientLabel, trackerRow, type OutreachEntry, type TrackerRow } from "@/lib/outreach";
import { byDeadline } from "@/lib/status";

type Props = {
  scholarships: Scholarship[];
  destNames: Record<string, string>;
  universities: Record<string, EmailUniversity[]>;
  today: string;
};

const chipTone: Record<TrackerRow["tone"], string> = {
  verified: "bg-verified-bg text-verified-fg",
  warning: "bg-warning-bg text-warning-fg",
  neutral: "bg-disabled text-ink",
};

const smallButton = "min-h-11 rounded-pill px-4 text-[11px] font-bold uppercase tracking-[.05em] no-underline";

function Header() {
  return (
    <section className="flex flex-wrap items-end justify-between gap-5 px-1 pt-[clamp(24px,4vw,48px)] pb-[clamp(16px,3vw,24px)]">
      <div>
        <p className="m-0 mb-3 text-xs font-semibold uppercase tracking-[.08em] text-teal">Saved</p>
        <h1 className="m-0 font-heading text-[clamp(36px,4.8vw,60px)] leading-[1.03] font-semibold tracking-[-.02em]">My shortlist</h1>
      </div>
    </section>
  );
}

export function ShortlistSkeleton() {
  return (
    <>
      <Header />
      <div aria-busy="true" aria-label="Loading your shortlist" className="h-[320px] rounded-card bg-surface" />
    </>
  );
}

export function ShortlistApp({ scholarships, destNames, universities, today }: Props) {
  const saved = useSaved();
  const checklists = useAllChecklists();
  const outreach = useOutreach();
  const [compose, setCompose] = useState<{ id: string; preset: EmailPreset } | null>(null);
  const [announce, setAnnounce] = useState("");

  // Saved items live in this browser: wait for it before deciding the list is empty.
  if (checklists === null || outreach === null) return <ShortlistSkeleton />;

  const list = saved
    .map((id) => scholarships.find((s) => s.id === id))
    .filter((s): s is Scholarship => s !== undefined)
    .sort(byDeadline(today));
  const composing = compose && scholarships.find((s) => s.id === compose.id);

  const rows = list.map((s) => {
    const d = deadlineView(s, today);
    const ck = checklists[s.id];
    const stats = ck ? checklistStats(ck) : null;
    const started = Boolean(stats && stats.answered);
    return { s, d, pct: stats?.pct ?? 0, started, needs: stats?.needs ?? 0, emails: outreach.filter((o) => o.scholarshipId === s.id) };
  });

  const stats = [
    { v: rows.length, l: "saved" },
    { v: rows.filter((r) => r.d.status === "Closing soon").length, l: "closing within 30 days" },
    { v: rows.filter((r) => r.started).length, l: "checklists in progress" },
    { v: outreach.filter((o) => saved.includes(o.scholarshipId) && o.status === "awaiting").length, l: "emails awaiting reply" },
  ];

  return (
    <>
      <Header />
      <p role="status" className="sr-only">
        {announce}
      </p>
      {announce && (
        <p aria-hidden="true" className="m-0 mb-4 rounded-input bg-verified-bg px-4 py-3 text-sm text-verified-fg">
          {announce}
        </p>
      )}
      {rows.length ? (
        <>
          <section aria-label="Summary" className="mb-4 grid gap-1 rounded-card bg-surface p-1.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))]">
            {stats.map((x) => (
              <div key={x.l} className="rounded-card-sm bg-surface-2 px-[18px] py-4">
                <p className="m-0 font-heading text-[30px] font-bold tabular-nums">{x.v}</p>
                <p className="m-0 mt-0.5 text-[13px] text-muted">{x.l}</p>
              </div>
            ))}
          </section>
          <div className="flex flex-col gap-3">
            {rows.map(({ s, d, pct, started, needs, emails }) => (
              <article
                key={s.id}
                aria-label={s.name}
                className={`grid items-center gap-x-6 gap-y-4 rounded-card p-[clamp(16px,2.2vw,24px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))] ${
                  d.closed ? "bg-surface-3" : "bg-surface"
                }`}
              >
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <StatusChip status={d.status} />
                    <span className="text-[13px] text-muted">
                      {destNames[s.destinationCode] ?? s.destinationCode} · {levelsText(s.levels)}
                    </span>
                  </span>
                  <h2 className={`m-0 font-heading text-[21px] leading-[1.2] font-semibold ${d.closed ? "text-muted" : ""}`}>{s.name}</h2>
                  <span className="text-[13px] text-muted">Closes {d.closeText}</span>
                </div>
                <div className="flex items-center gap-5">
                  <div className="flex-none">
                    <p className="m-0 font-heading text-[34px] leading-none font-bold tabular-nums">{d.days}</p>
                    <p className="m-0 mt-0.5 text-xs text-muted">days left</p>
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <span className="text-[13px] font-semibold">{started ? `${pct}% ready · ${needs} need work` : "Checklist not started"}</span>
                    <div
                      role="progressbar"
                      aria-label={`Checklist progress: ${s.name}`}
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-2 rounded-[4px] bg-disabled"
                    >
                      <div className="h-2 rounded-[4px] bg-navy" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 [justify-content:flex-end]">
                  {d.closed && <NotifyButton id={s.id} name={s.name} />}
                  <Link
                    href={`/checklist?s=${s.id}`}
                    className={`${smallButton} flex items-center bg-gold text-on-gold hover:bg-gold-hover hover:text-on-gold`}
                  >
                    {started ? "Continue check" : "Start check"}
                  </Link>
                  <Link
                    href={scholarshipHref(s.id)}
                    aria-label={`Details: ${s.name}`}
                    className={`${smallButton} flex items-center border-[1.5px] border-ink bg-surface text-ink hover:bg-surface-4 hover:text-ink`}
                  >
                    Details
                  </Link>
                  <CompareButton id={s.id} name={s.name} />
                  <button
                    type="button"
                    onClick={() => {
                      toggleSaved(s.id);
                      setAnnounce(`Removed ${s.name} from your shortlist.`);
                    }}
                    aria-label={`Remove ${s.name}`}
                    className={`${smallButton} border-0 bg-transparent px-3.5 text-muted hover:bg-surface-4`}
                  >
                    Remove
                  </button>
                </div>
                <EmailTracker
                  emails={emails}
                  today={today}
                  onWrite={() => setCompose({ id: s.id, preset: {} })}
                  onFollow={(o) =>
                    setCompose({ id: s.id, preset: { to: o.to, university: o.university, name: o.name, email: o.email, purpose: "follow_up", ref: o } })
                  }
                  onReplied={(o) => {
                    setOutreachStatus(o.id, "replied");
                    setAnnounce("Marked as replied.");
                  }}
                />
              </article>
            ))}
          </div>
        </>
      ) : (
        <section className="flex flex-col items-start gap-3.5 rounded-card-lg bg-surface p-[clamp(28px,5vw,56px)]">
          <h2 className="m-0 font-heading text-[28px] leading-[1.15] font-semibold">Nothing saved yet</h2>
          <p className="m-0 max-w-[520px] text-[15px] leading-[1.6] text-muted">
            Save scholarships while you browse. They appear here with your checklist progress and the days left to each deadline.
          </p>
          <Link
            href="/scholarships"
            className="flex min-h-12 items-center rounded-pill bg-gold px-[22px] text-xs font-bold uppercase tracking-[.05em] text-on-gold no-underline hover:bg-gold-hover hover:text-on-gold"
          >
            Find scholarships
          </Link>
        </section>
      )}
      {composing && compose && (
        <WriteEmailDialog
          scholarship={composing}
          universities={universities[composing.id] ?? []}
          preset={compose.preset}
          today={today}
          onClose={() => setCompose(null)}
          onSent={setAnnounce}
        />
      )}
      <CompareBar scholarships={scholarships} today={today} />
    </>
  );
}

function EmailTracker({
  emails,
  today,
  onWrite,
  onFollow,
  onReplied,
}: {
  emails: OutreachEntry[];
  today: string;
  onWrite: () => void;
  onFollow: (o: OutreachEntry) => void;
  onReplied: (o: OutreachEntry) => void;
}) {
  return (
    <div className="col-span-full flex flex-col gap-2.5 border-t border-border pt-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h3 className="m-0 text-[11px] font-bold uppercase tracking-[.08em] text-muted">Emails{emails.length ? ` · ${emails.length}` : ""}</h3>
        <button
          type="button"
          onClick={onWrite}
          className={`${smallButton} border-[1.5px] border-teal bg-surface text-teal hover:bg-tint-bg`}
        >
          Write email
        </button>
      </div>
      {emails.length === 0 ? (
        <p className="m-0 text-[13px] leading-normal text-muted">No emails yet. Ask a university office about eligibility, or contact a potential supervisor.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {emails.map((o) => {
            const r = trackerRow(o, today);
            return (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 rounded-bar bg-surface-2 px-3.5 py-3">
                <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`flex h-6 items-center rounded-chip-sm px-2.5 text-xs font-semibold ${chipTone[r.tone]}`}>{r.chip}</span>
                    <strong className="text-sm font-bold">{recipientLabel(o)}</strong>
                    <span className="text-[13px] text-muted">{o.university}</span>
                  </span>
                  <span className="text-[13px] text-muted tabular-nums">{r.meta}</span>
                </div>
                {r.open && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => onFollow(o)}
                      aria-label={`Follow up: ${o.subject}`}
                      className={`${smallButton} border-[1.5px] border-border-input bg-surface px-3.5 text-ink hover:bg-surface-4`}
                    >
                      Follow up
                    </button>
                    <button
                      type="button"
                      onClick={() => onReplied(o)}
                      aria-label={`Mark replied: ${o.subject}`}
                      className={`${smallButton} border-[1.5px] border-border-input bg-surface px-3.5 text-ink hover:bg-surface-4`}
                    >
                      Mark replied
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
