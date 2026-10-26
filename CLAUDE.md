# ScholarPath — project rules

Scholarship discovery and application-readiness app for Sri Lankan students (18–35, mostly on phones, often slow connections). Spec: `design/README.md`. Visual/behaviour reference: `design/ScholarPath.dc.html` (logic in the `class Component` block at the bottom; data constants just above it). Content: `design/data/*.json`.

Stack: Next.js (App Router, TypeScript strict), Tailwind mapped to the README tokens, Supabase (Postgres, Auth, RLS, Edge Functions), Vercel.

## Non-negotiable content rules
- **Never imply guaranteed funding.** No "you will get", "guaranteed", "secure your scholarship", "win". Use "Check your eligibility", "You may be eligible". Footer disclaimer on every page: "Information only. Funding is never guaranteed."
- **No funding values on the site.** Do not show funding type, amounts or "what it covers". No Funding type filter, no "Fully funded first" sort, no funding/covers rows in compare. Instead link out: "See funding details on the official website" → `officialUrl`.
- **Never invent university ranks.** The only source is THE World University Rankings 2027 (https://www.timeshighereducation.com/world-university-rankings), imported into the `universities` table with `rank_source_url` and `rank_retrieved_at`. Never take ranks from memory, other rankings or estimates. Unknown or not matched → "Rank band: to confirm". Ties as `=17`; bands for 301+ exactly as THE publishes them. Every rank table carries: "Ranking source: Times Higher Education World University Rankings 2027 (published September 2026)." Text only, no THE logo.
- **Always show "Verify on the official website"** on every scholarship detail page, next to the official link, plus the verification chip:
  - `checked` → teal chip "Dates checked {lastVerified}"
  - `expected_or_to_confirm` → warning-toned chip/note saying dates are expected or to confirm
  - `sample` → grey "Sample data"
- Never invent scholarship facts (amounts, dates, eligibility, award counts). Missing → "Not published" / leave empty, never guess.
- Professors are never listed by ScholarPath. Link to the university's staff directory; the student types the details.
- ScholarPath never sends email on the student's behalf: Gmail compose URL / Outlook deeplink / `mailto:` as real `<a target="_blank" rel="noopener">`, plus "Copy email instead".
- Copy in `ScholarPath.dc.html` is final. Reuse it verbatim; don't rewrite microcopy. The exception is funding copy, which is removed (see above).

## Accessibility (WCAG 2.2 AA)
- Mobile-first: build at 390px first, then scale to 1440px (content max-width 1380px, side padding `clamp(12px,3vw,32px)`). Header collapses to logo + menu below 1100px.
- **Every interactive target ≥ 44×44px** (most controls 44–50px). This includes chips, toggles, icon buttons, close buttons and calendar days.
- `:focus-visible` outline: 3px `#0E7383`, offset 2px. Never remove focus styles.
- Contrast ≥ 4.5:1 for text (3:1 for large text and UI boundaries). Status is never conveyed by colour alone (chip text always present).
- Semantic HTML first; real `<button>`/`<a>`; labelled form fields; errors linked via `aria-describedby`; modals/sheets/drawers trap focus, close on Esc, restore focus.
- Readable and usable at 200% zoom; no horizontal scroll at 320px.
- Respect `prefers-reduced-motion` and Save-Data: no autoplay video, poster image only.

## Engineering rules
- Design tokens live in `tailwind.config.ts` / CSS variables, named after README tokens. No raw hex values in components.
- Fonts via `next/font/google`: Urbanist (headings), Manrope (body/UI), IBM Plex Mono (data/meta). `tabular-nums` for ranks, dates, amounts.
- Icons: Lucide, line style.
- Deadline status comes from one shared `statusOf()` using the real current date (the prototype hard-codes 22 Oct 2026; don't). Closed items stay visible, muted, sorted last.
- Content pages are static/ISR for SEO and slow networks; keep client JS small. Use `next/image` for destination images.
- Secrets (service role key, LLM key, WhatsApp provider keys) server-side only. LLM calls only from server routes, rate-limited per user (20 drafts/day).
- RLS on every user table; users read/write only their own rows.
- WhatsApp: explicit opt-in checkbox (unticked by default), opt-out/STOP honoured. Comply with Sri Lanka PDPA (privacy notice, export/delete on request).
- Work phase by phase; at the end of each phase list what was built and anything that doesn't match the prototype.
