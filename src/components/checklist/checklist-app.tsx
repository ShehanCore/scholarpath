"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Eyebrow } from "@/components/ui/panel";
import {
  COMMITTEE_QUESTION,
  blankChecklist,
  checklistStats,
  encodeShare,
  prefill,
  showsResearchSection,
  type AppType,
  type Checklist,
  type ItemState,
} from "@/lib/checklist";
import { DRAFT, getChecklist, setChecklist, updateChecklist, useAllChecklists } from "@/lib/client/checklist-store";
import type { LevelCode, Scholarship } from "@/lib/content/types";
import { daysLeft } from "@/lib/status";
import { levels } from "@/lib/taxonomy";
import { formatDate } from "@/lib/verification";
import { CommitteePanel, ItemRow, QualityBars } from "./parts";
import { Summary } from "./summary";

type Step = "setup" | "review" | "summary";
type Props = { scholarships: Scholarship[]; destNames: Record<string, string>; today: string };

/**
 * The pre-submission checklist: setup → review → summary. Which scholarship (?s=) and step (?step=)
 * live in the URL (history.pushState, so Back works); answers are kept in this browser per scholarship.
 */
export function ChecklistApp({ scholarships, destNames, today }: Props) {
  const params = useSearchParams();
  const sParam = params.get("s");
  const linked = scholarships.find((s) => s.id === sParam) ?? null;
  const key = linked?.id ?? DRAFT;
  const all = useAllChecklists();
  const stored = all?.[key];
  const c = stored ?? (linked ? prefill(linked) : blankChecklist());
  const [tipOpen, setTipOpen] = useState<Record<string, boolean>>({});

  const setupIncomplete = !c.type || !c.level;
  const stepParam = params.get("step");
  // Arriving from a scholarship page: go straight to review if there are answers already.
  const step: Step =
    stepParam === "review" || stepParam === "summary" ? (setupIncomplete ? "setup" : stepParam) : stepParam === "setup" || !stored || !Object.keys(c.items).length ? "setup" : "review";

  // A scholarship opened for the first time starts pre-filled from its page.
  useEffect(() => {
    if (all && linked && !all[linked.id]) setChecklist(linked.id, prefill(linked));
  }, [all, linked]);

  const go = (next: { s?: string | null; step?: Step }) => {
    const p = new URLSearchParams(window.location.search);
    if (next.s !== undefined) {
      if (next.s) p.set("s", next.s);
      else p.delete("s");
    }
    if (next.step) p.set("step", next.step);
    window.history.pushState(null, "", `${window.location.pathname}?${p.toString()}`);
    window.scrollTo({ top: 0 });
  };
  const update = (fn: (x: Checklist) => Checklist) => updateChecklist(key, (x) => fn(stored ? x : c));

  const st = checklistStats(c);
  const title = linked ? linked.name : "Unlinked application";
  const dl = linked ? daysLeft(linked.closes, today) : null;
  const meta = [
    c.type === "grant" ? "Research grant" : "Scholarship",
    c.level ? levels.find((l) => l.code === c.level)?.name : "Level not set",
    dl !== null ? (dl >= 0 ? `${dl} days to deadline` : "deadline passed") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const setState = (id: string, s: ItemState | undefined) =>
    update((x) => {
      const items = { ...x.items };
      if (s) items[id] = s;
      else delete items[id];
      return { ...x, items };
    });
  const setNote = (id: string, n: string) => update((x) => ({ ...x, notes: { ...x.notes, [id]: n } }));
  const toggleTip = (id: string) => setTipOpen((t) => ({ ...t, [id]: !t[id] }));
  const sections = st.sections;

  const revisit = (itemId: string) => {
    setTipOpen((t) => ({ ...t, [itemId]: true }));
    go({ step: "review" });
    // Wait for the review to render, then bring the item into view.
    setTimeout(() => {
      const el = document.getElementById(`item-${itemId}`);
      el?.scrollIntoView({ block: "center" });
      el?.querySelector<HTMLButtonElement>("button[aria-pressed]")?.focus({ preventScroll: true });
    }, 50);
  };

  const steps: [Step, string][] = [
    ["setup", "1 · Setup"],
    ["review", "2 · Review"],
    ["summary", "3 · Summary"],
  ];

  return (
    <>
      <section className="grid items-end gap-5 px-1 pt-[clamp(24px,4vw,48px)] pb-[clamp(16px,3vw,28px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
        <div>
          <Eyebrow className="mb-3 text-teal">{linked ? linked.name : "Application checklist"}</Eyebrow>
          <h1 className="m-0 font-heading text-[clamp(36px,4.8vw,60px)] leading-[1.03] font-semibold tracking-[-.02em]">
            Pre-submission review
          </h1>
        </div>
        <nav aria-label="Checklist steps" data-noprint className="max-w-full justify-self-start overflow-x-auto">
          <ol className="m-0 flex list-none rounded-pill bg-surface p-[5px]">
            {steps.map(([k, label]) => {
              const on = step === k;
              const blocked = k !== "setup" && setupIncomplete;
              return (
                <li key={k}>
                  <button
                    type="button"
                    aria-current={on ? "step" : undefined}
                    aria-disabled={blocked || undefined}
                    aria-describedby={blocked ? "setup-hint" : undefined}
                    onClick={() => !blocked && go({ step: k })}
                    className={`min-h-11 rounded-pill border-0 px-[18px] text-xs font-semibold uppercase tracking-[.05em] whitespace-nowrap ${
                      on ? "bg-navy text-white" : "bg-transparent text-ink"
                    } ${blocked ? "cursor-not-allowed" : ""}`}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </section>

      {step === "setup" && (
        <Setup
          c={c}
          linked={linked}
          scholarships={scholarships}
          destNames={destNames}
          today={today}
          total={st.total}
          sectionCount={sections.length}
          answered={st.answered}
          onType={(type) => update((x) => ({ ...x, type }))}
          onLevel={(level) => update((x) => ({ ...x, level }))}
          onLink={(id) => {
            const target = scholarships.find((s) => s.id === id);
            if (target && !getChecklist(target.id)) {
              // Carry a draft over to the scholarship it was started for.
              const draft = getChecklist(DRAFT);
              setChecklist(target.id, draft && (draft.type || Object.keys(draft.items).length) ? draft : prefill(target));
            }
            go({ s: id || null, step: "setup" });
          }}
          onStart={() => go({ step: "review" })}
        />
      )}

      {step === "review" && (
        <section className="flex flex-wrap items-center justify-between gap-x-7 gap-y-4 rounded-card bg-surface px-[clamp(16px,2vw,24px)] py-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-heading text-[17px] font-semibold">{title}</span>
            <span className="text-[13px] text-muted">{meta}</span>
          </div>
          <div className="flex max-w-[420px] flex-[1_1_260px] flex-col gap-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">
                {st.answered} of {st.total} items answered
              </span>
              <span className="font-bold">{st.pct}% ready</span>
            </div>
            <div role="meter" aria-label="Overall readiness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={st.pct} className="h-2 rounded-[4px] bg-disabled">
              <div className="h-2 rounded-[4px] bg-navy" style={{ width: `${st.pct}%` }} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => go({ step: "summary" })}
            className="min-h-[46px] rounded-pill border-0 bg-gold px-5 text-xs font-bold uppercase tracking-[.05em] text-on-gold hover:bg-gold-hover"
          >
            View summary
          </button>
        </section>
      )}

      {step === "review" && (
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] items-start gap-4 min-[900px]:grid-cols-[230px_minmax(0,1fr)] min-[1240px]:grid-cols-[250px_minmax(0,1fr)_320px]">
          <aside aria-label="Sections" className="rounded-card bg-surface p-3.5 min-[900px]:sticky min-[900px]:top-24">
            <p className="mx-1.5 mt-1 mb-2.5 text-xs font-semibold uppercase tracking-[.06em] text-muted">Sections</p>
            <ul className="relative m-0 flex list-none gap-1 overflow-x-auto p-0 min-[900px]:flex-col">
              {sections.map((sec) => {
                const done = sec.items.filter((it) => c.items[it.id] === "done" || c.items[it.id] === "na").length;
                const complete = done === sec.items.length;
                return (
                  <li key={sec.letter} className="shrink-0">
                    <a
                      href={`#sec-${sec.letter}`}
                      className={`flex min-h-12 items-center gap-2.5 rounded-segment px-3 py-1.5 whitespace-nowrap no-underline hover:bg-surface-4 ${complete ? "text-teal hover:text-teal" : "text-ink hover:text-ink"}`}
                    >
                      <span className="w-4 font-mono text-xs font-semibold">{sec.letter}</span>
                      <span className="flex-1 text-[13px] font-semibold">{sec.short}</span>
                      <span className="font-mono text-xs font-medium text-muted">
                        {done}/{sec.items.length}
                        <span className="sr-only"> done</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </aside>
          <div className="flex min-w-0 flex-col gap-3">
            {sections.map((sec) => (
              <section key={sec.letter} id={`sec-${sec.letter}`} aria-labelledby={`sec-${sec.letter}-h`} className="scroll-mt-24 rounded-card bg-surface p-[clamp(16px,2.2vw,26px)]">
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2.5">
                  <h2 id={`sec-${sec.letter}-h`} className="m-0 font-heading text-[21px] font-semibold">
                    <span className="mr-2 font-mono text-sm font-medium text-muted">{sec.letter}</span>
                    {sec.title}
                  </h2>
                  <span className="flex h-7 items-center rounded-pill border border-border-input px-2.5 text-xs font-semibold">{sec.quality}</span>
                </div>
                {sec.researchOnly && (
                  <p className="m-0 mb-1.5 text-[13px] text-teal">Shown because this is a research grant, MPhil or PhD application.</p>
                )}
                {sec.items.map((it) => (
                  <ItemRow
                    key={it.id}
                    item={it}
                    state={c.items[it.id]}
                    note={c.notes[it.id] ?? ""}
                    onState={(s) => setState(it.id, s)}
                    onNote={(n) => setNote(it.id, n)}
                    tipOpen={Boolean(tipOpen[it.id])}
                    onTip={() => toggleTip(it.id)}
                  />
                ))}
              </section>
            ))}
            <button
              type="button"
              onClick={() => go({ step: "summary" })}
              className="min-h-[52px] self-end rounded-pill border-0 bg-gold px-7 text-[13px] font-bold uppercase tracking-[.05em] text-on-gold hover:bg-gold-hover"
            >
              See readiness summary
            </button>
          </div>
          <aside aria-label="Readiness" className="flex flex-col gap-3 min-[900px]:col-start-2 min-[1240px]:sticky min-[1240px]:top-24 min-[1240px]:col-start-3">
            <section aria-labelledby="by-quality" className="rounded-card bg-surface p-5">
              <h2 id="by-quality" className="m-0 mb-3.5 font-heading text-[17px] font-semibold">
                Readiness by quality
              </h2>
              <QualityBars bars={st.bars} />
            </section>
            <CommitteePanel type={c.type} collapsible />
          </aside>
        </div>
      )}

      {step === "summary" && (
        <div>
          <Summary
            title={title}
            checklist={c}
            linked={linked}
            today={today}
            onRevisit={revisit}
            shareUrl={() => `${window.location.origin}/checklist/shared#${encodeShare({ scholarshipId: linked?.id ?? null, ...c })}`}
          />
        </div>
      )}
    </>
  );
}

function Setup({
  c,
  linked,
  scholarships,
  destNames,
  today,
  total,
  sectionCount,
  answered,
  onType,
  onLevel,
  onLink,
  onStart,
}: {
  c: Checklist;
  linked: Scholarship | null;
  scholarships: Scholarship[];
  destNames: Record<string, string>;
  today: string;
  total: number;
  sectionCount: number;
  answered: number;
  onType: (t: AppType) => void;
  onLevel: (l: LevelCode) => void;
  onLink: (id: string) => void;
  onStart: () => void;
}) {
  const incomplete = !c.type || !c.level;
  const [tried, setTried] = useState(false);
  const types: [AppType, string][] = [
    ["scholarship", "Scholarship"],
    ["grant", "Research grant"],
  ];
  const dl = linked ? daysLeft(linked.closes, today) : null;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 min-[1040px]:grid-cols-[minmax(0,1fr)_380px]">
      <section aria-label="Setup" className="flex flex-col gap-[30px] rounded-card-lg bg-surface p-[clamp(18px,2.6vw,32px)]">
        <div>
          <p aria-hidden="true" className="m-0 mb-1 font-mono text-xs font-medium text-muted">
            01
          </p>
          <h2 id="setup-type" className="m-0 mb-3.5 font-heading text-[22px] font-semibold">
            What are you applying for?
          </h2>
          <div role="radiogroup" aria-labelledby="setup-type" className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
            {types.map(([k, label]) => {
              const on = c.type === k;
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onType(k)}
                  className={`flex flex-col gap-2.5 rounded-card-md border-2 p-5 text-left ${on ? "border-navy bg-surface-3" : "border-border bg-surface hover:border-border-strong"}`}
                >
                  <span className="font-heading text-[19px] font-semibold text-ink">{label}</span>
                  <span className="text-sm leading-normal text-muted">
                    The committee is asking: <span className="font-semibold text-ink">“{COMMITTEE_QUESTION[k]}”</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p aria-hidden="true" className="m-0 mb-1 font-mono text-xs font-medium text-muted">
            02
          </p>
          <h2 id="setup-level" className="m-0 mb-3.5 font-heading text-[22px] font-semibold">
            Your study level
          </h2>
          <div role="radiogroup" aria-labelledby="setup-level" className="flex flex-wrap gap-2">
            {levels.map((l) => {
              const on = c.level === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onLevel(l.code)}
                  className={`min-h-12 rounded-pill border-[1.5px] px-5 text-sm font-semibold ${on ? "border-navy bg-navy text-white" : "border-border-input bg-surface text-ink hover:bg-surface-4"}`}
                >
                  {l.name}
                </button>
              );
            })}
          </div>
          {showsResearchSection(c) && <p className="m-0 mt-3 text-[13px] text-teal">Includes section F — Research proposal.</p>}
        </div>
        <div>
          <p aria-hidden="true" className="m-0 mb-1 font-mono text-xs font-medium text-muted">
            03
          </p>
          <h2 className="m-0 mb-3.5 font-heading text-[22px] font-semibold">
            <label htmlFor="link-scholarship">Link a scholarship</label>
          </h2>
          <select
            id="link-scholarship"
            value={linked?.id ?? ""}
            onChange={(e) => onLink(e.target.value)}
            className="min-h-[52px] w-full max-w-[560px] rounded-bar border-[1.5px] border-ink bg-surface px-4 text-[15px] font-semibold"
          >
            <option value="">Not linked yet</option>
            {scholarships.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {destNames[s.destinationCode] ?? s.destinationCode}
              </option>
            ))}
          </select>
          {linked && (
            <div className="mt-3.5 flex flex-col gap-3 rounded-card-sm bg-surface-2 p-[18px]">
              <p className="m-0 text-sm text-muted">
                Deadline <span className="font-bold text-ink">{formatDate(linked.closes)}</span> ·{" "}
                {dl !== null && dl >= 0 ? `${dl} days left` : "closed"} · verify on the official website
              </p>
              {linked.documents ? (
                <ul aria-label="Required documents" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                  {linked.documents.map((d) => (
                    <li key={d} className="flex min-h-8 items-center rounded-pill bg-surface px-3 text-[13px] font-medium">
                      {d}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 text-[13px] text-muted">Required documents: Not published. Check the official website.</p>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-[22px]">
          <button
            type="button"
            aria-disabled={incomplete || undefined}
            aria-describedby="setup-hint"
            onClick={() => (incomplete ? setTried(true) : onStart())}
            className={`min-h-[52px] rounded-pill border-0 px-7 text-[13px] font-bold uppercase tracking-[.05em] text-on-gold ${incomplete ? "cursor-not-allowed bg-disabled" : "bg-gold hover:bg-gold-hover"}`}
          >
            {answered ? "Continue review" : "Start review"}
          </button>
          <span id="setup-hint" role={tried && incomplete ? "alert" : undefined} className={`text-[13px] ${tried && incomplete ? "font-semibold text-error" : "text-muted"}`}>
            {incomplete
              ? "Choose an application type and level to continue."
              : `${total} items across ${sectionCount} sections. Progress saves automatically.`}
          </span>
        </div>
      </section>
      <CommitteePanel type={c.type} />
    </div>
  );
}
