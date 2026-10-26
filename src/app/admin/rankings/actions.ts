"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { checkAdminAuth } from "@/lib/admin-auth";
import { serviceClient, serviceConfigured } from "@/lib/db/service-client";
import { RANK_SOURCE, RANK_SOURCE_URL, RANK_TO_CONFIRM, RANK_YEAR, parseRank } from "@/lib/rank";

export type RankFormState = { ok: boolean; message: string } | null;

/** Sets or clears one university's rank for the current edition. Empty clears it ("Rank band: to confirm"). */
export async function saveRank(_prev: RankFormState, form: FormData): Promise<RankFormState> {
  // The proxy already guards /admin; check again because server actions are plain POST endpoints.
  const editor = checkAdminAuth((await headers()).get("authorization"));
  if (!editor) return { ok: false, message: "You're not signed in to the admin." };
  if (!serviceConfigured) return { ok: false, message: "Connect Supabase (URL and secret key) to save ranks." };

  const universityId = String(form.get("universityId") ?? "");
  const raw = String(form.get("rank") ?? "").trim();
  const db = serviceClient();

  const { data: uni, error: uniError } = await db.from("universities").select("id, country_code").eq("id", universityId).maybeSingle();
  if (uniError || !uni) return { ok: false, message: "That university isn't in the database." };

  if (!raw) {
    const { error } = await db.from("rankings").delete().eq("university_id", universityId).eq("year", RANK_YEAR);
    if (error) return { ok: false, message: `Couldn't clear the rank: ${error.message}` };
    updateTag("universities");
    return { ok: true, message: `Cleared. Shows “${RANK_TO_CONFIRM}”.` };
  }

  const rank = parseRank(raw);
  if (!rank) return { ok: false, message: "Enter the rank exactly as published, for example 17, =17, 301–350 or 1501+." };

  const { error } = await db.from("rankings").upsert(
    {
      university_id: universityId,
      country_code: uni.country_code,
      rank_display: rank.rankDisplay,
      rank_sort: rank.rankSort,
      year: RANK_YEAR,
      source: RANK_SOURCE,
      source_url: RANK_SOURCE_URL,
      updated_by: editor,
    },
    { onConflict: "university_id,year" },
  );
  if (error) return { ok: false, message: `Couldn't save: ${error.message}` };
  updateTag("universities");
  return { ok: true, message: `Saved ${rank.rankDisplay}.` };
}
