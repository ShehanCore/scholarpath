import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Eyebrow, Panel } from "@/components/ui/panel";
import { designDestinations, designRankings, designUniversities } from "@/lib/content/design-data";
import { serviceClient, serviceConfigured } from "@/lib/db/service-client";
import { RANK_ATTRIBUTION, RANK_TO_CONFIRM, RANK_YEAR } from "@/lib/rank";
import { RankingsEditor, type EditorRow } from "./rankings-editor";

export const metadata: Metadata = { title: "Edit university ranks" };

export default function AdminRankingsPage() {
  return (
    <>
      <section className="px-1 pt-[clamp(24px,4vw,48px)] pb-6">
        <Eyebrow className="mb-3 text-teal">Admin</Eyebrow>
        <h1 className="m-0 font-heading text-[clamp(32px,4vw,48px)] leading-[1.05] font-semibold">University ranks {RANK_YEAR}</h1>
        <p className="mt-3 mb-0 max-w-[640px] text-[15px] leading-[1.6] text-muted">
          Enter each rank exactly as Times Higher Education publishes it: <code>17</code>, <code>=17</code>,{" "}
          <code>301–350</code> or <code>1501+</code>. Leave it empty to show “{RANK_TO_CONFIRM}”. Never enter a rank from
          memory or another ranking. Update once a year.
        </p>
      </section>
      <Panel>
        <Suspense fallback={<p className="m-0 text-sm text-muted">Loading ranks…</p>}>
          <Editor />
        </Suspense>
        <p className="mt-4 mb-0 text-xs text-muted">{RANK_ATTRIBUTION}</p>
      </Panel>
    </>
  );
}

async function Editor() {
  // Always read fresh from the database: this page shows what's stored, not the cached site.
  await connection();
  const destinations = designDestinations();
  const countryName = (code: string) => destinations.find((d) => d.code === code)?.name ?? code;

  let rows: EditorRow[];
  if (serviceConfigured) {
    const db = serviceClient();
    const [{ data: unis, error: e1 }, { data: ranks, error: e2 }] = await Promise.all([
      db.from("universities").select("id, name, country_code").order("name"),
      db.from("rankings").select("university_id, rank_display").eq("year", RANK_YEAR),
    ]);
    if (e1 || e2 || !unis || !ranks) return <p className="m-0 text-sm text-error">Couldn&apos;t load ranks: {(e1 ?? e2)?.message}</p>;
    const rankOf = new Map(ranks.map((r) => [r.university_id, r.rank_display]));
    rows = unis.map((u) => ({ id: u.id, name: u.name, countryCode: u.country_code, countryName: countryName(u.country_code), rank: rankOf.get(u.id) ?? "" }));
  } else {
    const rankOf = new Map(designRankings().map((r) => [r.universityId, r.rankDisplay]));
    rows = designUniversities()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((u) => ({ id: u.id, name: u.name, countryCode: u.countryCode, countryName: countryName(u.countryCode), rank: rankOf.get(u.id) ?? "" }));
  }
  rows.sort((a, b) => destinations.findIndex((d) => d.code === a.countryCode) - destinations.findIndex((d) => d.code === b.countryCode));

  return (
    <>
      {!serviceConfigured && (
        <p role="note" className="mt-0 mb-4 rounded-input bg-warning-bg px-4 py-3 text-sm text-warning-fg">
          Read-only: connect Supabase (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY) to save changes. Showing the
          ranks from design/data/universities.json.
        </p>
      )}
      <RankingsEditor rows={rows} editable={serviceConfigured} />
    </>
  );
}
