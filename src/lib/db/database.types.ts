// Types for the public content tables in supabase/migrations. Hand-written for now; once a Supabase project
// exists, regenerate with `npx supabase gen types typescript --project-id <id> > src/lib/db/database.types.ts`.

type LevelCode = "B" | "M" | "R" | "P";

type RankingRow = {
  university_id: string;
  country_code: string;
  rank_display: string;
  rank_sort: number;
  year: number;
  source: string;
  source_url: string | null;
};

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      destinations: Table<{ code: string; name: string; why: string; sort_order: number }>;
      disciplines: Table<{ slug: string; name: string; includes: string; sort_order: number }>;
      universities: Table<{
        id: string;
        name: string;
        city: string | null;
        country_code: string;
        levels: LevelCode[];
        website_url: string | null;
        staff_directory_url: string | null;
        updated_at: string;
      }>;
      scholarships: Table<{
        id: string;
        name: string;
        funder: string;
        funder_type: string;
        award_type: string;
        destination_code: string;
        university_id: string | null;
        levels: LevelCode[];
        disciplines_all: boolean;
        disciplines: string[];
        discipline_label: string | null;
        opens: string;
        closes: string;
        deadline_note: string | null;
        awards: string | null;
        summary: string | null;
        official_url: string;
        last_verified: string;
        verification_status: "checked" | "expected_or_to_confirm" | "sample";
        human_check_note: string | null;
        eligibility: string[] | null;
        documents: string[] | null;
        timeline: { label: string; when: string }[] | null;
        where_usable: string | null;
        updated_at: string;
      }>;
      scholarship_universities: Table<{ scholarship_id: string; university_id: string }>;
      rankings: Table<RankingRow & { id: number; updated_at: string; updated_by: string | null }>;
      reopen_alerts: Table<{
        id: number;
        scholarship_id: string;
        email: string;
        user_id: string | null;
        consent_at: string;
        token: string;
        created_at: string;
        notified_at: string | null;
        unsubscribed_at: string | null;
      }>;
    };
    Views: {
      current_rankings: { Row: RankingRow; Relationships: [] };
    };
    Functions: Record<never, never>;
    Enums: {
      level_code: LevelCode;
      verification_status: "checked" | "expected_or_to_confirm" | "sample";
    };
    CompositeTypes: Record<never, never>;
  };
};
