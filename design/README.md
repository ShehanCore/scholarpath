# Handoff: ScholarPath — scholarship discovery & application readiness

## Overview
ScholarPath helps students in Sri Lanka (18–35, mostly on mobile, many applying abroad for the first time) find scholarships and research funding to study abroad, then prepare an application they're confident in. Secondary users: parents, advisers, counsellors.

Core promise: *"Find the right scholarship and submit an application you're confident in."*

Four browse paths (Discipline, Level, Destination, University) all lead to one filterable finder. A pre-submission checklist scores readiness on five qualities (Fit, Evidence, Clarity, Feasibility, Impact). Students can register (incl. WhatsApp number for reminders), save scholarships, track checklist progress and email universities/professors from their own mail app.

## About the design files
`ScholarPath.dc.html` is a **design reference built in HTML** — a working prototype of intended look and behaviour, not production code. Recreate it in a real stack (recommended below). Open it directly in a browser (keep `support.js`, `image-slot.js` and `assets/` beside it). All logic lives in the `class Component` block at the bottom of the file; all data constants (`SCH`, `UNI`, `DEST`, `CK`, …) sit just above it and are also exported to `data/*.json`.

## Fidelity
**High-fidelity.** Colours, type, spacing, radii and copy are final. Recreate pixel-accurately. Content (scholarship facts) is partly verified — see *Data*.

## Recommended stack & hosting
- **Frontend:** Next.js (App Router) + TypeScript, static/ISR pages for SEO and slow connections. Tailwind or CSS modules mapped to the tokens below.
- **Backend:** Supabase (Postgres, Auth, Row Level Security, Edge Functions). Firebase is an acceptable alternative.
- **Hosting:** Vercel (frontend) + Supabase (DB). Domain e.g. `scholarpath.lk`; business email on the domain; Plausible analytics.
- **Content ops:** a simple admin (or Supabase table editor / Airtable sync) so staff can edit scholarships and `lastVerified` without a deploy.
- **AI email drafts:** server-side route calling an LLM; rate-limit per user (e.g. 20 drafts/day). Never call the model from the client.
- **WhatsApp:** WhatsApp Business Platform via a BSP (Twilio or 360dialog). Needs a verified Meta Business account, pre-approved message templates (deadline reminder, checklist nudge, follow-up reminder), explicit opt-in captured at registration, and STOP/opt-out handling.
- **Compliance:** Sri Lanka Personal Data Protection Act — privacy notice covering WhatsApp numbers and email logs; data export/delete on request.

## Screens / views
Routes in the prototype are `state.page` values. Breadcrumb pattern: `Destinations › United Kingdom › University of Edinburgh › Scholarship`.

1. **Home** (`home`) — search ("Search by subject, country, university or scholarship"), four large entry tiles (Discipline / Level / Destination / University), "Closing soon" strip, featured destinations (8 cards with animated video thumbnails, falling back to still images; respects `prefers-reduced-motion`), How it works (Find · Shortlist · Check · Apply), checklist promo.
2. **Scholarship finder** (`finder`) — filter panel (bottom sheet on mobile): Level, Discipline, Destination, University, Funding type, Award type, Eligible nationality (default Sri Lanka), Deadline range. Sort: Closing soon / Fully funded first / University rank. Removable active-filter chips. Result cards with Save + Compare (max 3) → compare drawer (level, funding, covers, eligibility, deadline, documents). Empty, loading (skeleton) and no-results states.
3. **Destinations** (`dests`) — grid of 18 destination cards + "Multi-country / Europe-wide": name, open scholarships, THE-ranked count, one-line why, next closing deadline.
4. **Destination page** (`uk` is the built example) — hero, quick facts, national scholarships, THE-ranked university table (ascending rank, ties as `=17`, bands for 301+, "Rank band: to confirm" when unknown), toggle "All universities / Has scholarships for my level", attribution line under every table: *"Ranking source: Times Higher Education World University Rankings 2027 (published September 2026)."* Text only — no THE logo.
5. **University page** (`uni`, example University of Melbourne) — rank & city, levels/disciplines, two groups: "Offered by this university" and "National scholarships you can use here", related universities.
6. **Scholarship detail** (`detail`, example Chevening) — summary bar (level, funding, status chip, destination), what it covers, eligibility self-check with "I meet this" toggles, required documents, selection timeline, where it can be used, official link + last-verified chip ("Dates checked 26 Oct 2026" in teal, or "Sample data" in grey), deadline note, primary CTA **Start my pre-submission check**. Support strip (workshops, mentor matching, interview prep, deadlines calendar).
7. **Discipline / Level page** (`cat`, shared template) — intro, key stats, filtered scholarships, top destinations.
8. **Pre-submission checklist** (`checklist`) — setup → in progress → summary (see *Interactions*).
9. **Deadlines calendar** (`deadlines`) — month and list views of saved + featured scholarships, per-item reminder toggle.
10. **My shortlist** (`shortlist`) — saved scholarships with checklist % and days left; **Emails** tracker per scholarship (see Outreach).
11. **Auth** — Login (`login`), 3-step Register (`reg1`–`reg3`: account → study profile → WhatsApp & notification consent), Account (`account`). Modal-style card, max-width 560px.

Header: white rounded bar (radius 16px, height 56px) containing logo, a 1px divider, and nav (Find scholarships, Destinations, Disciplines, Study levels, Application checklist, Deadlines, Saved), plus a separate gold "Check my application" button. Below 1100px, the header collapses to a logo plus menu. Footer: About, How we verify scholarships, Rankings note, Talk to an adviser, Privacy; disclaimer "Information only. Funding is never guaranteed."

## Interactions & behaviour
### Deadline status
`statusOf(s)` with today's date: **Closed** if `closes < today`; **Upcoming** if `opens > today`; **Closing soon** if ≤ 30 days left; else **Open**. Closed items stay visible but muted, with "Notify me when it reopens". Chip colours in `data/taxonomy.json → statusChipColors`.

### Checklist (`data/checklist.json`)
- Setup: application type Scholarship / Research grant (pre-filled from scholarship page), shows the committee question (`committeeQuestion`); choose level; link scholarship (pulls deadline + documents).
- Sections A–I, each tagged with a quality. **Section F (Research proposal) only shows for Research grant, MPhil & Postgraduate, or PhD.**
- Each item: Done / Needs work / Not applicable, expandable "Why this matters" tip, optional note.
- Side panel "What this committee weighs most" switches column by application type (`committeeWeights`).
- Summary: overall % + five plain horizontal bars (no gauges/radar), list of all "Needs work" items, days left, actions Download PDF / Print, Share with mentor, Book an application review, and the reminder *"A high GPA alone doesn't guarantee success. Prioritise fit, evidence, clarity, feasibility and impact."*
- Scoring: % = Done ÷ (applicable items). N/A items are excluded. Quality bars use the same formula per quality.
- Progress persists per scholarship and shows on My shortlist.

### Outreach (email universities & professors)
- "Write email" opens a modal at any time. Recipient type: Admissions & scholarships office / International office / Professor or supervisor. Purpose: eligibility question, supervision enquiry (professors), follow-up.
- Professors are **never listed by ScholarPath**: show a link to the university's staff directory; the student types name, email and a paper/research area.
- **Draft with AI** (server route) uses scholarship, level and checklist notes; unknowns appear in `[brackets]`. **Use template** gives a structured fallback.
- Live checks (right panel): addressed to a named person/office, names the scholarship, asks one clear question, mentions the professor's research (prof only), no `[placeholders]` left, no generic flattery, under 200 words.
- Sending opens the student's own client in a new tab: Gmail compose URL, Outlook deeplink, or `mailto:`; plus "Copy email instead". Gmail can't be framed, so links must be real `<a target="_blank">`, not iframes. ScholarPath never sends on the student's behalf.
- After sending, log entry `{to, uni, name, email, purpose, subject, sentAt, status}`; statuses Awaiting reply → Follow-up due (≥10 days) → Replied / Followed up. A WhatsApp follow-up reminder fires at day 10 (template message).

### Accessibility
WCAG 2.2 AA; 44px minimum targets (most controls 44–50px); `:focus-visible` outline 3px #0E7383 offset 2px; readable at 200% zoom; mobile-first (390px) through desktop (1440px; content max-width 1380px, side padding `clamp(12px,3vw,32px)`).

## State management
Per user (persist in DB; prototype uses localStorage key `scholarpath-v1`):
`saved: string[]` · `checks: {[scholarshipId]: {type, level, st: {[itemId]: 'done'|'needs'|'na'}, notes}}` · `elig: {[schId]: {[i]: bool}}` · `rem: {[schId]: bool}` (reminders) · `out: {[schId]: OutreachEntry[]}` · `user: {name, email, whatsapp, waOptIn, level, disciplines, nationality}`.
UI state: finder filters `f`, `sort`, `cmp` (≤3 ids), sheet/drawer open flags, calendar view/month.

Suggested tables: `scholarships`, `universities`, `destinations`, `scholarship_universities` (where usable), `users`, `saved`, `checklists`, `checklist_items`, `outreach`, `reminders`, `verification_log`.

## Data
`data/scholarships.json` (26 records), `universities.json`, `destinations.json`, `taxonomy.json`, `checklist.json`.
- `verificationStatus`: `checked` (dates confirmed from published 2027/28 info; still confirm on official site), `expected_or_to_confirm` (pattern-based or unconfirmed — label in UI), `sample`.
- Each record has `officialUrl`, `lastVerified`, `deadlineNote`. Detail pages must always show "Verify on the official website".
- Flags needing a human check: Manaaki NZ (Sri Lanka may no longer be eligible), Melbourne International Undergraduate (country list), SINGA (no live official 2027 page found), Swiss Excellence (country-specific deadline), all "Varies by university" records.
- University ranks: THE WUR 2027 only as listed in the brief. Never invent ranks.
- Wording rule: never imply guaranteed funding ("Check your eligibility").

## Design tokens
**Colours**
- Ink `#10202F` (primary text) · Muted `#4B5A6B` · Navy primary `#0B2A4A` · Teal accent/links `#0E7383` (hover → `#0B2A4A`)
- Gold CTA `#F2AE3D` (hover `#E89E22`, pressed `#C98A1B`), text on gold `#0B2A4A`
- Page bg `#EDEFF2` · Surfaces `#FFFFFF`, `#F4F5F7`, `#F7F8FA`, `#F1F3F5` · Borders `#E1E5EA`, `#D5DBE1`, input `#CBD2D9`
- Status/notes: teal tint `#E3F1F2`/`#0A5A66`, verified `#E3F1EF`/`#0B5560`, warning `#FCF1DC`/`#5C3B00`, closing `#FCEBC8`/`#6B4200`, upcoming `#E5EBF2`/`#0B2A4A`, closed `#ECEEF0`/`#4B5A6B`, error `#B3261E`

**Type** (Google Fonts)
- Headings: **Urbanist** 600 — 22px, 24px, 28px/1.15, page titles `clamp(24px,3vw,32px)`, heroes larger
- Body/UI: **Manrope** 400–800 — 15px body (line-height 1.5–1.6), 13–14px secondary, 11–12px uppercase labels (700, letter-spacing .05–.08em)
- Data/meta: **IBM Plex Mono** 500 — 11–12px (chips like "Sample data", dates). Use `font-variant-numeric: tabular-nums` for ranks, dates, amounts.

**Radii:** pills/buttons `999px` · cards `28px` (large), `24px`, `20px`, `18px` · inputs/segments `12–14px` · small chips `7–10px`.
**Shadows:** dropdown `0 12px 40px rgba(11,42,74,.16)` · modal `0 30px 80px rgba(16,32,47,.28)` · segmented active `0 1px 3px rgba(16,32,47,.18)`.
**Spacing:** 4-pt rhythm; common gaps 4/6/8/10/12/14/16/20/24px; section padding `clamp(20px,3.5vw,36px)`.

## Assets
- `assets/logo-v3.png` (header/footer/auth), `logo-v3-reversed.png` (dark grounds), `icon-v3.png` (app icon/favicon).
- Destination thumbnails: `dest-gb-v3.png`, `dest-{cc}-v2.png` for the other 17 (generated with Higgsfield, AI imagery — replace with licensed photography before launch if preferred).
- Animated thumbnails: `dest-{gb,us,au,ca,de,nl,jp,eu}.mp4` (muted, loop, `playsinline`; poster = matching PNG; disabled when reduced-motion or Save-Data).
- Icons: simple line icons — use an icon library (e.g. Lucide). Flags only where they aid scanning.

## Files
- `ScholarPath.dc.html` — full prototype (template + logic + data)
- `support.js`, `image-slot.js` — runtime for viewing the prototype only (not needed in production)
- `assets/` — logo, icon, destination images & videos
- `data/` — JSON exports of all content

## Launch checklist
1. Mobile pass at 390px on every screen; accessibility audit.
2. Usability test with 5–8 Sri Lankan students on phones.
3. Human verification of every `expected_or_to_confirm` record; assign a data owner and a re-check cadence (before each cycle).
4. Publish "How we verify scholarships", privacy notice, rankings note.
5. Meta WhatsApp templates approved; opt-in/opt-out tested.
6. SEO metadata per scholarship/destination; sitemap.
7. Soft launch with one university or counselling partner, then public.
