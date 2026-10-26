"use client";

import { toggleSaved, useSaved } from "@/lib/client/saved-store";

export function SaveButton({ id, name, size = "sm" }: { id: string; name: string; size?: "sm" | "lg" }) {
  const saved = useSaved().includes(id);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={`${saved ? "Saved" : "Save"}: ${name}`}
      onClick={() => toggleSaved(id)}
      className={`h-11 shrink-0 rounded-pill border-[1.5px] border-ink font-bold uppercase tracking-[.05em] ${
        size === "lg" ? "px-[18px] text-xs" : "px-3.5 text-[11px]"
      } ${
        saved ? "bg-ink text-white" : "bg-surface text-ink hover:bg-surface-4"
      }`}
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}
