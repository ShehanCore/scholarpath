# ScholarPath

Scholarship discovery and application-readiness app for Sri Lankan students.

- Spec and prototype: `design/README.md`, `design/ScholarPath.dc.html`
- Build plan and data corrections: `design/BUILD_PLAN.md`
- Project rules: `CLAUDE.md`

## Run locally

```bash
npm install
npm run dev   # http://localhost:3000
```

Without Supabase environment variables the app reads content from `design/data`. To connect a database, see `supabase/README.md` and `.env.example`.

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests (deadline status, ranks, data corrections, rank import) |
| `PGPORT=5432 supabase/tests/run.sh` | Migrations, seed and RLS tests against a local Postgres |
| `npm run db:seed:generate` | Regenerate `supabase/seed.sql` from `design/data` |
| `npm run db:ranks -- file.csv [--year 2027]` | Turn a rankings CSV you downloaded into SQL for the `rankings` table |

`npm run lint`, `npm test` and `npm run build` must pass before each push. Node 20+.
