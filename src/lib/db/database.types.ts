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
      profiles: Table<{
        id: string;
        name: string;
        role: "Student" | "Parent" | "Adviser / counsellor";
        whatsapp: string | null;
        wa_opt_in: boolean;
        wa_opt_in_at: string | null;
        wa_opt_out_at: string | null;
        levels: LevelCode[];
        disciplines: string[];
        destinations: string[];
        nationality: string;
        intake: "2027" | "2028" | "Not sure" | null;
        deadline_reminders: boolean;
        terms_accepted_at: string | null;
        created_at: string;
        updated_at: string;
      }>;
      saved: Table<{ user_id: string; scholarship_id: string; created_at: string }>;
      reminders: Table<{ user_id: string; scholarship_id: string; enabled: boolean; created_at: string; notified_for: string | null; token: string }>;
      outreach: Table<{
        id: number;
        user_id: string;
        client_id: string;
        scholarship_id: string | null;
        recipient_type: "admissions" | "international" | "professor";
        university_name: string | null;
        recipient_name: string | null;
        recipient_email: string | null;
        purpose: "eligibility" | "supervision" | "follow_up";
        subject: string;
        sent_at: string;
        status: "awaiting" | "replied" | "followed_up";
        followed_up_at: string | null;
        replied_at: string | null;
      }>;
      eligibility_answers: Table<{ user_id: string; scholarship_id: string; answers: Record<string, boolean>; updated_at: string }>;
      checklists: Table<{
        id: number;
        user_id: string;
        scholarship_id: string | null;
        application_type: "scholarship" | "grant";
        level: LevelCode | null;
        created_at: string;
        updated_at: string;
      }>;
      checklist_items: Table<{
        checklist_id: number;
        item_id: string;
        state: "done" | "needs" | "na" | null;
        note: string | null;
        updated_at: string;
      }>;
      ai_draft_usage: Table<{ user_id: string; day: string; count: number }>;
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
    Functions: {
      take_ai_draft: { Args: { p_user: string; p_day: string; p_limit: number }; Returns: boolean };
      give_back_ai_draft: { Args: { p_user: string; p_day: string }; Returns: undefined };
    };
    Enums: {
      level_code: LevelCode;
      verification_status: "checked" | "expected_or_to_confirm" | "sample";
    };
    CompositeTypes: Record<never, never>;
  };
};
