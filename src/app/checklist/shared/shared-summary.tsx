"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Summary } from "@/components/checklist/summary";
import { decodeShare } from "@/lib/checklist";
import type { Scholarship } from "@/lib/content/types";

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

/** Read-only summary a student shares with a mentor. The data is in the link's #fragment only. */
export function SharedSummary({ scholarships, today }: { scholarships: Scholarship[]; today: string }) {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash.slice(1), () => null);
  if (hash === null) return <div aria-busy="true" className="mt-4 h-[420px] rounded-card-lg bg-surface" />;
  const shared = hash ? decodeShare(hash) : null;
  if (!shared)
    return (
      <section className="mt-4 rounded-card-lg bg-surface p-[clamp(18px,2.6vw,32px)]">
        <h2 className="m-0 mb-2 font-heading text-[22px] font-semibold">This share link isn&apos;t complete</h2>
        <p className="m-0 text-[15px] text-muted">
          Ask the student to copy the link again from their checklist summary. <Link href="/checklist">Start your own check</Link>
        </p>
      </section>
    );
  const linked = scholarships.find((s) => s.id === shared.scholarshipId) ?? null;
  return (
    <div className="mt-4">
      <Summary title={linked ? linked.name : "Unlinked application"} checklist={shared} linked={linked} today={today} />
    </div>
  );
}
