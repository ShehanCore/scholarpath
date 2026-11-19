import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Eyebrow, Panel } from "@/components/ui/panel";
import { StatusChip } from "@/components/ui/status-chip";
import { designScholarships } from "@/lib/content/design-data";
import type { Scholarship } from "@/lib/content/types";
import { serviceClient, serviceConfigured } from "@/lib/db/service-client";
import { toScholarship } from "@/lib/db/queries";
import { formatDate } from "@/lib/format";
import { statusOf, todayIso } from "@/lib/status";
import { verificationChip } from "@/lib/verification";

export const metadata: Metadata = { title: "Edit scholarships" };

export default function AdminScholarshipsPage() {
  return (
    <>
      <div className="pt-4">
        <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Scholarships" }]} />
      </div>
      <section className="px-1 pt-[clamp(16px,3vw,32px)] pb-6">
        <Eyebrow className="mb-3 text-teal">Admin</Eyebrow>
        <h1 className="m-0 font-heading text-[clamp(32px,4vw,48px)] leading-[1.05] font-semibold">Scholarships</h1>
        <p className="mt-3 mb-0 max-w-[680px] text-[15px] leading-[1.6] text-muted">
          Check each record against its official website before changing it. Never guess: leave a section empty and
          the site shows “Not published”. Records still to confirm are listed first.
        </p>
      </section>
      <Panel>
        <Suspense fallback={<p className="m-0 text-sm text-muted">Loading scholarships…</p>}>
          <List />
        </Suspense>
      </Panel>
    </>
  );
}

const needsCheck = (s: Scholarship) => s.verificationStatus !== "checked" || Boolean(s.humanCheckNote);

async function List() {
  // Always read fresh: this page shows what's stored, not the cached site.
  await connection();
  let list: Scholarship[];
  if (serviceConfigured) {
    const { data, error } = await serviceClient().from("scholarships").select("*");
    if (error || !data) return <p className="m-0 text-sm text-error">Couldn&apos;t load scholarships: {error?.message}</p>;
    list = data.map(toScholarship);
  } else list = designScholarships();
  const today = todayIso();
  list.sort((a, b) => Number(needsCheck(b)) - Number(needsCheck(a)) || a.lastVerified.localeCompare(b.lastVerified) || a.name.localeCompare(b.name));
  const toCheck = list.filter(needsCheck).length;

  return (
    <>
      {!serviceConfigured && (
        <p role="note" className="mt-0 mb-4 rounded-input bg-warning-bg px-4 py-3 text-sm text-warning-fg">
          Read-only: connect Supabase to edit. Showing design/data/scholarships.json.
        </p>
      )}
      <p className="mt-0 mb-3 text-sm font-semibold">
        {list.length} scholarships · {toCheck} to confirm
      </p>
      <ul className="m-0 list-none p-0">
        {list.map((s) => {
          const chip = verificationChip(s);
          return (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border py-3">
              <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
                <Link href={`/admin/scholarships/${s.id}`} className="text-[15px] font-semibold">
                  {s.name}
                </Link>
                <span className="text-[13px] text-muted">
                  Closes {formatDate(s.closes)} · last checked {formatDate(s.lastVerified)}
                  {s.humanCheckNote ? ` · ${s.humanCheckNote}` : ""}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip status={statusOf(s, today)} />
                <span
                  className={`flex h-7 items-center rounded-[8px] px-2.5 font-mono text-xs font-medium ${
                    chip.tone === "verified" ? "bg-verified-bg text-verified-fg" : chip.tone === "warning" ? "bg-warning-bg text-warning-fg" : "bg-closed-bg text-closed-fg"
                  }`}
                >
                  {chip.label}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
