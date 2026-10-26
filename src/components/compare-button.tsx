"use client";

import { toggleCompare, useCompare } from "@/lib/client/compare-store";

export function CompareButton({ id, name }: { id: string; name: string }) {
  const on = useCompare().includes(id);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`Compare: ${name}`}
      onClick={() => toggleCompare(id)}
      className={`min-h-11 shrink-0 rounded-pill border-[1.5px] border-border-input px-3.5 text-[11px] font-bold uppercase tracking-[.05em] ${
        on ? "bg-tint-bg text-tint-fg" : "bg-surface text-ink hover:bg-surface-4"
      }`}
    >
      {on ? "✓ Comparing" : "Compare"}
    </button>
  );
}
