import type { DeadlineStatus } from "@/lib/status";

const tone: Record<DeadlineStatus, string> = {
  Open: "bg-tint-bg text-tint-fg",
  "Closing soon": "bg-closing-bg text-closing-fg",
  Upcoming: "bg-upcoming-bg text-upcoming-fg",
  Closed: "bg-closed-bg text-closed-fg",
};

/** Deadline status chip. The label is always shown, so status never relies on colour. */
export function StatusChip({ status }: { status: DeadlineStatus }) {
  return (
    <span className={`flex h-7 shrink-0 items-center rounded-[8px] px-2.5 text-xs font-semibold ${tone[status]}`}>
      {status}
    </span>
  );
}
