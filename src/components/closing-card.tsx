import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Scholarship } from "@/lib/content/types";
import { deadlineView, destinationChip, levelsText, scholarshipHref } from "@/lib/format";
import { SaveButton } from "./save-button";
import { StatusChip } from "./ui/status-chip";

/** Card in the home page's horizontally scrolling "Closing soon" strip. */
export function ClosingCard({ s, today }: { s: Scholarship; today: string }) {
  const d = deadlineView(s, today);
  return (
    <article className="flex shrink-0 grow-0 basis-[min(300px,82vw)] snap-start flex-col gap-3 rounded-card-md border border-border p-[18px]">
      <div className="flex items-center justify-between gap-2">
        <StatusChip status={d.status} />
        <span className="font-mono text-xs font-medium text-muted">{destinationChip(s.destinationCode)}</span>
      </div>
      <div>
        <h3 className="m-0 mb-1 font-heading text-lg leading-[1.2] font-semibold">{s.name}</h3>
        <p className="m-0 text-[13px] text-muted">
          {s.funder} · {s.funderType}
        </p>
      </div>
      <p className="m-0 text-[13px]">{levelsText(s.levels)}</p>
      <div className="mt-auto flex items-end justify-between gap-2 border-t border-border pt-3">
        <div>
          <p className="m-0 font-heading text-[22px] font-bold">{d.days}</p>
          <p className="m-0 text-xs text-muted">days left · closes {d.closeText}</p>
        </div>
        <div className="flex gap-1.5">
          <SaveButton id={s.id} name={s.name} />
          <Link
            href={scholarshipHref(s.id)}
            aria-label={`View ${s.name}`}
            className="flex size-11 items-center justify-center rounded-pill bg-navy text-white hover:bg-ink hover:text-white"
          >
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}
