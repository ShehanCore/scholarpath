# Turn on AI email drafts and reminder emails

Two services, each switched on by adding keys in Vercel. Until then the site still works: "Draft with AI"
fills in the template, and reminder / reopen requests are saved and wait.

Every Vercel step below is in **Vercel → your project → Settings → Environment Variables**. Add each
variable for **Production** (and Preview if you test there), then **Deployments → ⋯ → Redeploy** the latest
deployment: running code only sees variables that existed when it was deployed.

Never put these keys in the code, in chat, or in a variable starting with `NEXT_PUBLIC_` (those are sent to
browsers).

---

## 1. "Draft with AI" — Anthropic API key

### 1.1 Create the key
1. Sign in at **console.anthropic.com** with the ScholarPath business account (not a personal one). Create
   an organisation called ScholarPath if asked.
2. **Billing**: add a payment method and buy a small amount of credit to start (e.g. US$10–20). The API
   stops when credit runs out; turn on auto-reload later if usage is steady.
3. **Limits / spend limits**: set a monthly spend limit (e.g. US$25 at launch). This is your safety net on
   top of ScholarPath's own 20-drafts-a-day-per-student cap.
4. **API keys → Create key**, name it `scholarpath-production`. Copy it once (it starts `sk-ant-`); the
   Console won't show it again.

### 1.2 Add it to Vercel
| Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | the key from 1.1 |
| `ANTHROPIC_MODEL` | optional — leave unset for Claude Opus 5.5 |

Redeploy.

### 1.3 Which model
Drafts are short (one email, under 200 words), so cost per draft is small. Rough estimates:

| `ANTHROPIC_MODEL` | Quality | Rough cost per draft | 1,000 drafts |
|---|---|---|---|
| unset (`claude-opus-5-5`) | best | ~US$0.02 | ~US$20 |
| `claude-sonnet-5-5` | very good | ~US$0.01 | ~US$10 |
| `claude-haiku-5-5` | good for short emails | well under US$0.001 | under US$1 |

Opus and Sonnet re-run a declined request on a fallback model automatically. Haiku doesn't: if it declines,
the student gets the template instead. Start with the default, look at the bill after a month (Console →
Usage), and switch by changing `ANTHROPIC_MODEL` and redeploying — no code change.

### 1.4 Test
Log in on the live site, save a scholarship, open **My shortlist → Write email → Draft with AI**. You should
get a draft and the yellow note "AI draft. Check every fact…". If you see "AI drafting isn't available
here", the key isn't set or you haven't redeployed; "Couldn't reach the AI drafter" means the key is wrong,
credit ran out, or the spend limit was hit (Vercel → your project → Logs shows `AI draft failed` with the
reason).

---

## 2. Reminder and reopen emails — Resend

ScholarPath sends two kinds of email, both from daily jobs in `vercel.json`:
- **Notify me when it reopens** — 07:45 Sri Lanka time.
- **Remind me** (Deadlines page) — 08:00 Sri Lanka time, 7 days before the closing date.

Student-to-university emails are *not* sent this way; those always open in the student's own mail app.

### 2.1 Verify the sending domain
1. Sign up at **resend.com** with the business account.
2. **Domains → Add domain**: use a subdomain such as `mail.scholarpath.lk` (keeps your main domain's email
   reputation separate). Pick the region closest to you.
3. Resend shows DNS records (an MX and TXT record for SPF, a TXT record for DKIM). Add each one exactly at
   your domain's DNS host (where `scholarpath.lk` is registered or managed — e.g. your registrar or
   Cloudflare). Then press **Verify** in Resend; DNS can take from minutes to a few hours.
4. Also add a DMARC record if you don't have one: TXT at `_dmarc.scholarpath.lk` with
   `v=DMARC1; p=none; rua=mailto:you@scholarpath.lk`. Gmail and Yahoo expect it from senders.

### 2.2 Create the API key
**API keys → Create API key**, name `scholarpath-production`, permission **Sending access**, limited to the
domain from 2.1. Copy it (starts `re_`).

### 2.3 Add to Vercel
| Name | Value |
|---|---|
| `RESEND_API_KEY` | the key from 2.2 |
| `ALERTS_FROM_EMAIL` | `ScholarPath <alerts@mail.scholarpath.lk>` (must be on the verified domain) |
| `CRON_SECRET` | a long random string — run `openssl rand -hex 32` in a terminal, or use a password manager's generator |
| `NEXT_PUBLIC_SITE_URL` | `https://scholarpath.lk` (used for links inside the emails) |
| `SUPABASE_SECRET_KEY` | already needed for the admin; the jobs use it too |

Redeploy. Vercel then runs both jobs every day (on the Hobby plan, at some point within that hour) and sends `CRON_SECRET` with each run; nobody else can
trigger them. Jobs run only on the **Production** deployment. Vercel → your project → **Settings → Cron
Jobs** lists them and lets you run one now.

### 2.4 Test
1. In Supabase → Table Editor → `scholarships`, temporarily set one scholarship's `closes` to 7 days from
   today (note the real date first).
2. On the live site, log in, open **Deadlines**, and switch **Remind me** on for it.
3. Vercel → Settings → Cron Jobs → `/api/cron/deadline-reminders` → **Run**. The response shows
   `{"due":1,"sent":1,…}` and the email arrives. Its "Stop this reminder" link should work.
4. Put the real `closes` date back.

If the run says `Email isn't configured`, a Resend variable is missing; a Resend error in the logs usually
means the From address isn't on the verified domain.

---

## 3. What the privacy notice must cover (drafted with Phase 9)

For the Sri Lanka PDPA and Google's consent screen, the notice at `/privacy` needs to say, in plain words:
- **Who we are**: legal name of the business, address, and a contact email for privacy requests.
- **What we collect and why**: account (name, email, role), WhatsApp number (account contact; WhatsApp
  messages only with the opt-in), study plans, saved scholarships, checklist answers and notes, reminders.
- **Email log**: when a student opens an email in their mail app we keep who it was to (office or
  professor's name and email), the university, purpose, subject and date — *not* the message. Used only to
  show the tracker and follow-up reminders.
- **AI drafts**: when a student presses Draft with AI, the scholarship, recipient details, research topic,
  their name and checklist notes are sent to Anthropic to write the draft. Nothing is sent unless they press
  the button; ScholarPath doesn't store the draft unless they send it (then only the subject is logged).
- **Processors**: Supabase (database and sign-in), Vercel (hosting), Resend (emails), Anthropic (AI
  drafts), Google (only if they choose Google sign-in), the WhatsApp provider (Phase 9) — and where they
  store data (outside Sri Lanka).
- **Retention**: how long each kind of data is kept, and that deleting the account removes it.
- **Rights**: download your data and delete your account (both on `/account`), stop WhatsApp with STOP,
  stop emails with the link in each one, and how to complain to the Data Protection Authority.
