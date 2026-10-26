// Domain types shared by the Supabase and local content sources.
// Funding values (type, amounts, "what it covers") are deliberately absent: see design/BUILD_PLAN.md, correction 1.

export type LevelCode = "B" | "M" | "R" | "P";

export type VerificationStatus = "checked" | "expected_or_to_confirm" | "sample";

export type Destination = {
  code: string;
  name: string;
  why: string;
  sortOrder: number;
};

export type University = {
  id: string;
  name: string;
  city: string | null;
  countryCode: string;
  levels: LevelCode[];
  /** Rank exactly as published ("1", "=17", "301–350"); null shows "Rank band: to confirm". */
  rankDisplay: string | null;
  /** Number to order by ("=17" → 17, "301–350" → 301); null when unranked. */
  rankSort: number | null;
  websiteUrl: string | null;
  staffDirectoryUrl: string | null;
};

/** A row of the `rankings` table: one university's rank in one edition. */
export type Ranking = {
  universityId: string;
  countryCode: string;
  rankDisplay: string;
  rankSort: number;
  year: number;
  source: string;
  sourceUrl: string | null;
};

export type TimelineStep = { label: string; when: string };

export type Scholarship = {
  id: string;
  name: string;
  funder: string;
  funderType: string;
  awardType: string;
  destinationCode: string;
  /** Set when the scholarship belongs to one university; null for national / multi-university awards. */
  universityId: string | null;
  levels: LevelCode[];
  /** True when open to all disciplines; otherwise see `disciplines`. */
  disciplinesAll: boolean;
  disciplines: string[];
  disciplineLabel: string | null;
  /** ISO dates (YYYY-MM-DD). */
  opens: string;
  closes: string;
  deadlineNote: string | null;
  awards: string | null;
  summary: string | null;
  officialUrl: string;
  /** ISO date. */
  lastVerified: string;
  verificationStatus: VerificationStatus;
  /** Set while a person still needs to confirm this record (BUILD_PLAN correction 8). */
  humanCheckNote: string | null;
  /** Detail sections; null means "Not published". */
  eligibility: string[] | null;
  documents: string[] | null;
  timeline: TimelineStep[] | null;
  whereUsable: string | null;
};
