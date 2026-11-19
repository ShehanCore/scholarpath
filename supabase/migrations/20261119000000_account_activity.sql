-- Inactive accounts (privacy notice: deleted after 60 days without use, after a warning email).
-- last_seen_at: when the account was last used (updated by the site at most once a day), so a student
-- who stays signed in for months still counts as active. inactivity_warned_at: when the warning was sent.
alter table public.profiles
  add column if not exists last_seen_at timestamptz not null default now(),
  add column if not exists inactivity_warned_at timestamptz;
