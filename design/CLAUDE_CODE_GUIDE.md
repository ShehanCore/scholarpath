# Building ScholarPath with Claude Code — step by step

## 0. What you need
- A computer (macOS, Linux, or Windows with WSL)
- Node.js 18+ (`node -v` to check), Git
- A Claude Pro/Max plan or an Anthropic API key
- Accounts (free tiers are fine to start): GitHub, Vercel, Supabase

## 1. Install Claude Code
```bash
npm install -g @anthropic-ai/claude-code
claude --version
```
Run `claude` once and sign in when prompted.

## 2. Set up the project folder
```bash
mkdir scholarpath && cd scholarpath
git init
```
Unzip this handoff into a sub-folder called `design/`:
```
scholarpath/
  design/            ← this handoff (README.md, data/, assets/, ScholarPath.dc.html)
```

## 3. Start Claude Code
```bash
claude
```
First message — paste this:

> Read `design/README.md` fully, then skim `design/ScholarPath.dc.html` and the files in `design/data/`. Don't write code yet. Summarise the screens, data model and tokens, and propose a build plan in phases using Next.js (App Router, TypeScript), Tailwind mapped to the README tokens, and Supabase. Create a `CLAUDE.md` with the project rules: mobile-first, WCAG 2.2 AA, 44px targets, never imply guaranteed funding, never invent university ranks, always show "Verify on the official website".

Review the plan, correct anything, then say "go ahead with phase 1".

## 4. Build in phases (one prompt each)
Work in small steps; check the result in the browser (`npm run dev`, then http://localhost:3000) after each.

1. **Scaffold & tokens** — "Create the Next.js app, Tailwind config with the README colour/type/radius tokens, load Urbanist, Manrope and IBM Plex Mono, copy `design/assets` to `public/`. Build the header and footer exactly as in the prototype."
2. **Data layer** — "Create a Supabase schema from the README's suggested tables, a seed script that loads `design/data/*.json`, and typed query helpers. Include `verificationStatus`, `lastVerified`, `officialUrl`."
3. **Home + Destinations + Destination page + University page.**
4. **Finder** — filters, sort, chips, compare drawer, empty/loading/no-results states, bottom sheet on mobile.
5. **Scholarship detail** — eligibility self-check, timeline, verification chip.
6. **Checklist** — setup, sections A–I with the Section F rule, side panel, summary with five bars, PDF/print.
7. **Auth & registration** — Supabase Auth, 3-step register with WhatsApp number + explicit opt-in checkbox.
8. **Shortlist, Deadlines calendar, Email outreach** — Gmail/Outlook/mailto links, live checks, tracker; AI draft via a server route with rate limiting.
9. **WhatsApp reminders** — scheduled Supabase function + Twilio/360dialog templates (deadline in 14/3 days, follow-up after 10 days).
10. **Admin** — simple protected page to edit scholarships and mark "Last verified".

Useful prompt pattern for each phase:
> Implement phase N. Match `design/ScholarPath.dc.html` (search for `isFinder` etc. to find the screen) pixel-accurately at 390px and 1440px. When done, list what you built and anything you couldn't match.

## 5. Keep it on track
- After each phase: `git add -A && git commit -m "phase N"` (or ask Claude to commit).
- If something looks off, describe it or paste a screenshot: "The finder chips wrap badly at 390px — fix to match the prototype."
- Ask for a review: "Run an accessibility pass on the finder: contrast, focus order, labels, 44px targets."
- Use `/clear` between big phases to keep context small; `CLAUDE.md` keeps the rules.

## 6. Deploy
1. Push to GitHub: ask Claude "create a GitHub repo and push" (or do it manually).
2. **Supabase:** create a project, run the migration + seed, copy the URL and anon key.
3. **Vercel:** import the GitHub repo, add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, WhatsApp provider keys), deploy.
4. Connect your domain (e.g. `scholarpath.lk`) in Vercel → Domains.
5. WhatsApp: verify your Meta Business account and submit message templates for approval (can take days — start early).

## 7. Before public launch
Follow the "Launch checklist" at the end of `README.md`.
