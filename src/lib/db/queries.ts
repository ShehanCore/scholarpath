// Content queries. Read from Supabase when it's configured; otherwise from design/data (with the same
// corrections), so pages build and run before a Supabase project exists.
import { cacheLife, cacheTag } from "next/cache";
import {
  designDestinations,
  designRankings,
  designScholarships,
  designUniversities,
  withRankings,
} from "@/lib/content/design-data";
import type { Destination, Ranking, Scholarship, University } from "@/lib/content/types";
import { byRank } from "@/lib/rank";
import { contentClient, supabaseConfigured } from "./client";
import type { Database } from "./database.types";

type Rows = Database["public"]["Tables"];

function toUniversity(r: Rows["universities"]["Row"]): Omit<University, "rankDisplay" | "rankSort"> {
  return {
    id: r.id,
    name: r.name,
    city: r.city,
    countryCode: r.country_code,
    levels: r.levels,
    websiteUrl: r.website_url,
    staffDirectoryUrl: r.staff_directory_url,
  };
}

export function toScholarship(r: Rows["scholarships"]["Row"]): Scholarship {
  return {
    id: r.id,
    name: r.name,
    funder: r.funder,
    funderType: r.funder_type,
    awardType: r.award_type,
    destinationCode: r.destination_code,
    universityId: r.university_id,
    levels: r.levels,
    disciplinesAll: r.disciplines_all,
    disciplines: r.disciplines,
    disciplineLabel: r.discipline_label,
    opens: r.opens,
    closes: r.closes,
    deadlineNote: r.deadline_note,
    awards: r.awards,
    summary: r.summary,
    officialUrl: r.official_url,
    lastVerified: r.last_verified,
    verificationStatus: r.verification_status,
    humanCheckNote: r.human_check_note,
    eligibility: r.eligibility,
    documents: r.documents,
    timeline: r.timeline,
    whereUsable: r.where_usable,
  };
}

function orThrow<T>({ data, error }: { data: T | null; error: { message: string } | null }, what: string): T {
  if (error || data === null) throw new Error(`Couldn't load ${what}: ${error?.message ?? "no data"}`);
  return data;
}

export async function getDestinations(): Promise<Destination[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("content", "destinations");
  if (!supabaseConfigured) return designDestinations();
  const rows = orThrow(await contentClient().from("destinations").select("*").order("sort_order"), "destinations");
  return rows.map((r) => ({ code: r.code, name: r.name, why: r.why, sortOrder: r.sort_order }));
}

/** Each university's current rank (latest edition). */
export async function getRankings(): Promise<Ranking[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("content", "universities");
  if (!supabaseConfigured) return designRankings();
  return orThrow(await contentClient().from("current_rankings").select("*"), "rankings").map((r) => ({
    universityId: r.university_id,
    countryCode: r.country_code,
    rankDisplay: r.rank_display,
    rankSort: r.rank_sort,
    year: r.year,
    source: r.source,
    sourceUrl: r.source_url,
  }));
}

/** All universities with their current rank, ascending by rank, unranked last. */
export async function getUniversities(): Promise<University[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("content", "universities");
  if (!supabaseConfigured) return designUniversities().sort(byRank);
  const [rows, rankings] = await Promise.all([
    contentClient().from("universities").select("*"),
    getRankings(),
  ]);
  return withRankings(orThrow(rows, "universities").map(toUniversity), rankings).sort(byRank);
}

export async function getUniversity(id: string): Promise<University | null> {
  return (await getUniversities()).find((u) => u.id === id) ?? null;
}

export async function getScholarships(): Promise<Scholarship[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("content", "scholarships");
  if (!supabaseConfigured) return designScholarships();
  return orThrow(await contentClient().from("scholarships").select("*").order("closes"), "scholarships").map(
    toScholarship,
  );
}

export async function getScholarship(id: string): Promise<Scholarship | null> {
  return (await getScholarships()).find((s) => s.id === id) ?? null;
}

/** University ids where each scholarship can be used, keyed by scholarship id. */
export async function getScholarshipUniversities(): Promise<Record<string, string[]>> {
  "use cache";
  cacheLife("hours");
  cacheTag("content", "scholarships");
  const pairs = supabaseConfigured
    ? orThrow(await contentClient().from("scholarship_universities").select("*"), "scholarship universities")
    : designScholarships()
        .filter((s) => s.universityId)
        .map((s) => ({ scholarship_id: s.id, university_id: s.universityId as string }));
  const out: Record<string, string[]> = {};
  for (const p of pairs) (out[p.scholarship_id] ??= []).push(p.university_id);
  return out;
}
