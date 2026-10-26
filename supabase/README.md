# Database

- `migrations/` — schema, row-level security and grants. Apply in filename order.
- `seed.sql` — content generated from `design/data/*.json` with the corrections in `design/BUILD_PLAN.md`. Safe to re-run. Regenerate with `npm run db:seed:generate`; don't edit by hand.
- `ranks/the-wur-2027.sql` — university ranks, generated from THE (see below). Not present until the first import.
- `tests/` — runs the migrations, seed and RLS tests against any local Postgres: `PGPORT=5432 supabase/tests/run.sh`.

## Set up a Supabase project

1. Create a project at supabase.com (region: Mumbai `ap-south-1` is closest to Sri Lanka).
2. SQL Editor → paste and run `migrations/20261026000000_initial_schema.sql`, then `seed.sql`.
   (Or with the Supabase CLI: `npx supabase link --project-ref <ref>` then `npx supabase db push` and run the seed.)
3. Project Settings → API Keys: copy the project URL and the **publishable** key into `.env.local` and into Vercel
   (see `.env.example`). The **secret** key goes only in Vercel's server-side environment variables, never in the browser or in chat.

Until step 3, the app reads the same content from `design/data`, so it builds and runs without a database.

## University ranks (THE World University Rankings 2027 only)

Ranks are never typed in by hand or taken from anywhere else. Every university starts as "Rank band: to confirm".

1. Open https://www.timeshighereducation.com/world-university-rankings (2027 edition).
2. Make a CSV with a header row `rank,name` and copy each row's rank and institution name exactly as THE shows them
   (ties like `=17`, bands like `301–350`). Add a `university_id` column to force a match when names differ.
3. `npm run db:ranks -- the-wur-2027.csv --retrieved YYYY-MM-DD` writes `ranks/the-wur-2027.sql` and lists
   universities that weren't matched (they stay "to confirm").
4. Run that SQL in the SQL Editor and commit it.
