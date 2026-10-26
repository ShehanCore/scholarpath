"use client";

// Building blocks shared by the checklist's review layouts and summary.
import { useId, useState } from "react";
import {
  committeeRows,
  type AppType,
  type ChecklistItem,
  type ItemState,
  type QualityBar,
} from "@/lib/checklist";

const OPTIONS: [ItemState, string][] = [
  ["done", "Done"],
  ["needs", "Needs work"],
  ["na", "N/A"],
];

const selected: Record<ItemState, string> = {
  done: "border-navy bg-navy text-white",
  needs: "border-gold-pressed bg-closing-bg text-warning-fg",
  na: "border-muted bg-disabled text-ink",
};

/** One checklist item: Done / Needs work / N/A (press again to clear), "Why this matters" and a note. */
export function ItemRow({
  item,
  state,
  note,
  onState,
  onNote,
  tipOpen,
  onTip,
  variant,
}: {
  item: ChecklistItem;
  state: ItemState | undefined;
  note: string;
  onState: (s: ItemState | undefined) => void;
  onNote: (n: string) => void;
  tipOpen: boolean;
  onTip: () => void;
  /** "row" for layout A (inline), "card" for layout B (stacked on a grey card). */
  variant: "row" | "card";
}) {
  const id = useId();
  const [noteOpen, setNoteOpen] = useState(Boolean(note));
  const card = variant === "card";
  return (
    <div
      id={`item-${item.id}`}
      className={card ? "flex flex-col gap-3 rounded-card-md bg-surface-2 p-[18px]" : "flex flex-col gap-2 border-t border-border py-3.5"}
    >
      <div className={card ? "flex flex-col gap-3" : "flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5"}>
        <p id={`${id}-text`} className={`m-0 text-pretty ${card ? "text-base leading-[1.45] font-semibold" : "flex-[1_1_300px] text-[15px] leading-normal"}`}>
          {item.text}
        </p>
        <div
          role="group"
          aria-labelledby={`${id}-text`}
          className={card ? "grid max-w-[440px] grid-cols-3 gap-1.5" : "flex flex-wrap gap-1.5"}
        >
          {OPTIONS.map(([k, label]) => {
            const on = state === k;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => onState(on ? undefined : k)}
                className={`border-[1.5px] px-3.5 text-[13px] font-semibold whitespace-nowrap ${
                  card ? "min-h-[46px] rounded-segment" : "min-h-11 rounded-pill"
                } ${on ? selected[k] : "border-border-input bg-surface text-ink hover:bg-surface-4"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-[18px] gap-y-1">
        <button
          type="button"
          aria-expanded={tipOpen}
          aria-controls={`${id}-tip`}
          onClick={onTip}
          className="min-h-11 border-0 bg-transparent p-0 text-[13px] font-semibold text-teal"
        >
          {tipOpen ? "− " : "+ "}Why this matters
        </button>
        <button
          type="button"
          aria-expanded={noteOpen}
          aria-controls={`${id}-note`}
          onClick={() => setNoteOpen(!noteOpen)}
          className="min-h-11 border-0 bg-transparent p-0 text-[13px] font-semibold text-muted"
        >
          {note ? "Note" : noteOpen ? "Hide note" : "Add note"}
        </button>
      </div>
      <p id={`${id}-tip`} hidden={!tipOpen} className={`m-0 rounded-segment px-3.5 py-3 text-sm leading-[1.55] ${card ? "bg-surface" : "bg-tint-bg"}`}>
        {item.tip}
      </p>
      <div id={`${id}-note`} hidden={!noteOpen}>
        <label className="sr-only" htmlFor={`${id}-note-input`}>
          Note for: {item.text}
        </label>
        <textarea
          id={`${id}-note-input`}
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder="Add a note for yourself or your mentor"
          rows={2}
          className="w-full resize-y rounded-segment border-[1.5px] border-border-input bg-surface px-3 py-2.5 text-sm font-medium"
        />
      </div>
    </div>
  );
}

/** Five plain horizontal bars, one per quality. */
export function QualityBars({ bars, size = "md", barClass = "bg-teal" }: { bars: QualityBar[]; size?: "sm" | "md" | "lg"; barClass?: string }) {
  const h = size === "lg" ? "h-2.5" : size === "md" ? "h-1.5" : "h-1.5";
  return (
    <div className={`flex flex-col ${size === "lg" ? "gap-4" : "gap-3"}`}>
      {bars.map((b) => (
        <div key={b.quality} className="flex flex-col gap-1.5">
          <div className={`flex justify-between ${size === "lg" ? "text-sm" : "text-[13px]"}`}>
            <span className={size === "lg" ? "font-bold" : "font-semibold"}>{b.quality}</span>
            <span className="text-muted">{b.label}</span>
          </div>
          <div
            role="meter"
            aria-label={`${b.quality} readiness`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={b.pct}
            className={`${h} rounded-[5px] bg-disabled`}
          >
            <div className={`${h} rounded-[5px] ${barClass}`} style={{ width: `${b.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** "What this committee weighs most", with the column for the application type. */
export function CommitteePanel({ type, collapsible = false, title = "What this committee weighs most" }: { type: AppType | null; collapsible?: boolean; title?: string }) {
  const [open, setOpen] = useState(true);
  const id = useId();
  const label = type === "grant" ? "Research grant · weights vary by funder" : "Scholarship · weights vary by funder";
  return (
    <section aria-labelledby={`${id}-h`} className="rounded-card bg-surface p-5">
      {collapsible ? (
        <h2 id={`${id}-h`} className="m-0">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            onClick={() => setOpen(!open)}
            className="flex min-h-11 w-full items-center justify-between border-0 bg-transparent p-0 text-left font-heading text-[17px] font-semibold text-ink"
          >
            {title}
            <span aria-hidden="true" className="font-sans text-lg text-muted">
              {open ? "−" : "+"}
            </span>
          </button>
        </h2>
      ) : (
        <h2 id={`${id}-h`} className="m-0 mb-1 font-heading text-[17px] font-semibold">
          {title}
        </h2>
      )}
      <p className="mt-0.5 mb-2 text-[13px] text-muted">{label}</p>
      <dl id={`${id}-list`} hidden={!open} className="m-0">
        {committeeRows(type).map((r) => (
          <div key={r.factor} className="grid grid-cols-2 gap-2.5 border-t border-border py-2.5">
            <dt className="text-[13px] text-muted">{r.factor}</dt>
            <dd className={`m-0 text-[13px] ${r.strong ? "font-bold" : "font-medium"}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
