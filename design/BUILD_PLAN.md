# ScholarPath — build plan

Companion to `design/README.md` (spec) and `CLAUDE.md` (project rules). Where this plan and the README disagree, this plan wins: it records decisions made after the handoff.

Stack: Next.js (App Router, TypeScript strict) · Tailwind v4 (tokens as CSS variables in `src/app/globals.css`) · Supabase (Postgres, Auth, RLS, Edge Functions) · Vercel.

## Phases

Each phase ends with a commit and a short report: what was built, and anything that doesn't match `design/ScholarPath.dc.html`.

1. **Scaffold & tokens** — Next.js app, design tokens, fonts (Urbanist, Manrope, IBM Plex Mono via `next/font`), `design/assets` copied to `public/assets`, header (desktop bar + mobile menu), footer, placeholder routes so every nav link resolves.
2. **Data layer** — Supabase schema (`scholarships`, `universities`, `destinations`, `scholarship_universities`, `users`, `saved`, `checklists`, `checklist_items`, `outreach`, `reminders`, `verification_log`), RLS on every user table, seed script from `design/data/*.json` applying the corrections below, typed query helpers, shared `statusOf()`.
3. **Content pages** — Home (layouts A and B behind a switcher until one is chosen), Destinations, Destination page, University page, Discipline / Level page. Static/ISR, refreshed hourly.
4. **Finder** — filters, sort, active-filter chips, compare drawer (max 3), empty / loading / no-results states, bottom sheet on mobile. Read these query params, which Phase 3 pages already link to: `lv` (level code, e.g. `P`), `disc` (discipline slug), `dest` (destination code), `aw` (award type), `dl` (days until deadline, e.g. `30`), `q` (search text).
5. **Scholarship detail** — eligibility self-check, documents, timeline, verification chip, official link.
6. **Checklist** — setup, sections A–I (Section F rule), committee-weights panel, summary with five bars, PDF/print.
7. **Auth & registration** — Supabase Auth, login, 3-step register with WhatsApp number and unticked opt-in checkbox, account page.
8. **Shortlist, Deadlines calendar, Email outreach** — Gmail / Outlook / `mailto:` links, live checks, tracker; AI draft via rate-limited server route (20/day).
9. **WhatsApp reminders** — scheduled Supabase function + BSP templates (deadline in 14 / 3 days, follow-up at day 10), STOP handling.
10. **Admin, SEO, privacy** — protected editor for scholarships and `lastVerified`, per-page metadata, sitemap, privacy notice, PDPA export/delete.

## Data corrections (apply in the Phase 2 seed and in the UI)

1. **Remove funding values.** Drop `fund` / funding type / amounts / "what it covers" from everything rendered, including funding clauses inside summaries and deadline notes (cut in `src/lib/content/design-data.ts`, guarded by a test). In their place: "See funding details on the official website" → `officialUrl`. Keep the raw JSON untouched in `design/data/`; the seed simply doesn't import those fields.
2. **Ranks from THE WUR 2027 only.** Import ranks from https://www.timeshighereducation.com/world-university-rankings into `universities` with `rank_source_url` and `rank_retrieved_at`. Ranks in the prototype and `universities.json` are not trusted. Ties as `=17`; bands for 301+ exactly as THE publishes them. Unknown or unmatched → "Rank band: to confirm". Attribution line under every rank table.
3. **Verification chip logic** from `verificationStatus`: `checked` → teal "Dates checked {lastVerified}"; `expected_or_to_confirm` → warning-toned note that dates are expected or to confirm; `sample` → grey "Sample data". Always paired with "Verify on the official website".
4. **No funding filter or funding sort.** Remove the Funding type filter, the "Fully funded first" sort and the funding / covers rows in compare. Sorts: Closing soon, University rank.
5. **Destination counts are computed**, not hard-coded: open scholarships = records for that destination whose `statusOf()` isn't Closed; THE-ranked count = universities with a confirmed THE 2027 rank.
6. **Rank band fallbacks.** Any university without a confirmed THE 2027 rank shows "Rank band: to confirm" and sorts after ranked universities.
7. **Generic detail fallback.** The prototype's detail page is hard-wired to Chevening content. Every other scholarship renders from its own record; any missing section shows "Not published" rather than Chevening's text.
8. **Human-check flags.** Flag for manual review before launch, and show the `expected_or_to_confirm` note until cleared: Manaaki NZ (Sri Lanka may no longer be eligible), Melbourne International Undergraduate (country list), SINGA (no live official 2027 page found), Swiss Excellence (country-specific deadline), and every "Varies by university" record.
