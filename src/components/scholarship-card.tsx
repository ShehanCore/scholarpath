import Link from "next/link";
import type { Scholarship } from "@/lib/content/types";
import { deadlineView, levelsText, scholarshipHref } from "@/lib/format";
import { SaveButton } from "./save-button";
import { StatusChip } from "./ui/status-chip";
import { Tag } from "./ui/tag";

/**
 * Scholarship card used on destination, university and category pages. Closed scholarships stay visible
 * on a muted background (text keeps full contrast). Funding values are never shown (CLAUDE.md).
 */
export function ScholarshipCard({
  s,
  today,
  eyebrow,
  showFunder = false,
  disciplineStyle = "plain",
}: {
  s: Scholarship;
  today: string;
  eyebrow: string;
  showFunder?: boolean;
  /** "navy" marks subject-specific awards on discipline pages. */
  disciplineStyle?: "plain" | "navy";
}) {
  const d = deadlineView(s, today);
  return (
    <article
      className={`flex flex-col gap-3 rounded-[22px] border border-border p-5 ${d.closed ? "bg-surface-3" : "bg-surface"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[.06em] text-muted">{eyebrow}</span>
        <StatusChip status={d.status} />
      </div>
      <div>
        <h3 className="m-0 font-heading text-xl leading-[1.2] font-semibold">{s.name}</h3>
        {showFunder && (
          <p className="mt-1 mb-0 text-[13px] text-muted">
            {s.funder} · {s.funderType}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Tag>{levelsText(s.levels)}</Tag>
        {s.disciplinesAll ? (
          <Tag tone="teal">Open to all disciplines</Tag>
        ) : (
          s.disciplineLabel && (
            <Tag tone={disciplineStyle}>
              {disciplineStyle === "navy" ? `Subject-specific · ${s.disciplineLabel}` : s.disciplineLabel}
            </Tag>
          )
        )}
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <p className="m-0 text-[13px] text-muted">
          Closes <span className="font-semibold text-ink">{d.closeText}</span> · {d.daysText}
        </p>
        <div className="flex gap-1.5">
          <SaveButton id={s.id} name={s.name} />
          <Link
            href={scholarshipHref(s.id)}
            aria-label={`Details: ${s.name}`}
            className="flex min-h-11 items-center rounded-pill bg-navy px-4 text-[11px] font-bold uppercase tracking-[.05em] text-white no-underline hover:bg-ink hover:text-white"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export function CardGrid({ children, min = 340 }: { children: React.ReactNode; min?: number }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fill,minmax(min(100%,${min}px),1fr))` }}>
      {children}
    </div>
  );
}
