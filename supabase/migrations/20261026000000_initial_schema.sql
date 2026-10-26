-- ScholarPath initial schema.
-- Content tables are public-read and written only by the service role (seed, admin).
-- User tables have RLS so each user reads and writes only their own rows.
-- Funding values are deliberately not stored (design/BUILD_PLAN.md, correction 1).

create type public.level_code as enum ('B', 'M', 'R', 'P');
create type public.verification_status as enum ('checked', 'expected_or_to_confirm', 'sample');
create type public.checklist_item_state as enum ('done', 'needs', 'na');
create type public.application_type as enum ('scholarship', 'grant');
create type public.outreach_recipient as enum ('admissions', 'international', 'professor');
create type public.outreach_purpose as enum ('eligibility', 'supervision', 'follow_up');
create type public.outreach_status as enum ('awaiting', 'replied', 'followed_up');

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- content

create table public.destinations (
  code text primary key check (code ~ '^[A-Z]{2}$'),
  name text not null,
  why text not null,
  sort_order int not null default 0
);

create table public.disciplines (
  slug text primary key,
  name text not null unique,
  includes text not null,
  sort_order int not null default 0
);

create table public.universities (
  id text primary key,
  name text not null,
  city text,
  country_code text not null references public.destinations (code),
  levels public.level_code[] not null default '{}',
  website_url text,
  staff_directory_url text,
  updated_at timestamptz not null default now(),
  unique (id, country_code)
);
create index universities_country_idx on public.universities (country_code);

-- University ranks, one row per university per edition. Source: THE World University Rankings as
-- recorded in the brief, edited in the admin; updated once a year. A university with no row shows
-- "Rank band: to confirm". rank_display is exactly as published ("1", "=17", "301–350", "1501+");
-- rank_sort is the number to order by (17, 301) — never sort on rank_display.
create table public.rankings (
  id bigint generated always as identity primary key,
  university_id text not null,
  country_code text not null,
  rank_display text not null check (rank_display ~ '^(=?\d+|\d+–\d+|\d+\+)$'),
  rank_sort int not null check (rank_sort = substring(rank_display from '\d+')::int),
  year int not null check (year between 2000 and 2100),
  source text not null,
  source_url text check (source_url is null or source_url ~ '^https://'),
  updated_at timestamptz not null default now(),
  updated_by text,
  unique (university_id, year),
  foreign key (university_id, country_code) references public.universities (id, country_code)
    on update cascade on delete cascade
);
create index rankings_year_sort_idx on public.rankings (year, rank_sort);

-- Latest edition's rank for each university.
create view public.current_rankings with (security_invoker = true) as
  select distinct on (university_id) university_id, country_code, rank_display, rank_sort, year, source, source_url
  from public.rankings
  order by university_id, year desc;

create table public.scholarships (
  id text primary key,
  name text not null,
  funder text not null,
  funder_type text not null,
  award_type text not null,
  destination_code text not null references public.destinations (code),
  -- Set when the scholarship belongs to one university.
  university_id text references public.universities (id),
  levels public.level_code[] not null check (cardinality(levels) > 0),
  disciplines_all boolean not null default false,
  disciplines text[] not null default '{}',
  discipline_label text,
  opens date not null,
  closes date not null,
  deadline_note text,
  awards text,
  summary text,
  official_url text not null check (official_url ~ '^https://'),
  last_verified date not null,
  verification_status public.verification_status not null,
  -- Set while a person still needs to confirm the record (correction 8). Cleared in the admin.
  human_check_note text,
  -- Detail sections; null shows "Not published".
  eligibility text[],
  documents text[],
  timeline jsonb check (timeline is null or jsonb_typeof(timeline) = 'array'),
  where_usable text,
  updated_at timestamptz not null default now(),
  check (opens <= closes),
  check (disciplines_all or cardinality(disciplines) > 0)
);
create index scholarships_destination_idx on public.scholarships (destination_code);
create index scholarships_university_idx on public.scholarships (university_id);
create index scholarships_closes_idx on public.scholarships (closes);

-- Universities where a national scholarship can be used.
create table public.scholarship_universities (
  scholarship_id text not null references public.scholarships (id) on delete cascade,
  university_id text not null references public.universities (id) on delete cascade,
  primary key (scholarship_id, university_id)
);
create index scholarship_universities_university_idx on public.scholarship_universities (university_id);

create table public.verification_log (
  id bigint generated always as identity primary key,
  scholarship_id text not null references public.scholarships (id) on delete cascade,
  verified_at timestamptz not null default now(),
  verified_by uuid references auth.users (id) on delete set null,
  status public.verification_status not null,
  note text
);
create index verification_log_scholarship_idx on public.verification_log (scholarship_id, verified_at desc);

create trigger universities_updated_at before update on public.universities
  for each row execute function public.set_updated_at();
create trigger rankings_updated_at before update on public.rankings
  for each row execute function public.set_updated_at();
create trigger scholarships_updated_at before update on public.scholarships
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- users

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  role text not null default 'Student' check (role in ('Student', 'Parent', 'Adviser / counsellor')),
  -- E.164, e.g. +94771234567. Optional; only used for WhatsApp when wa_opt_in is true.
  whatsapp text check (whatsapp is null or whatsapp ~ '^\+[1-9]\d{6,14}$'),
  -- Explicit opt-in only; never defaulted on. Timestamps are set by profiles_whatsapp_consent.
  wa_opt_in boolean not null default false,
  wa_opt_in_at timestamptz,
  wa_opt_out_at timestamptz,
  -- Study profile (registration step 2), used to suggest scholarships and pre-fill filters.
  levels public.level_code[] not null default '{}',
  disciplines text[] not null default '{}',
  destinations text[] not null default '{}',
  nationality text not null default 'Sri Lanka',
  intake text check (intake is null or intake in ('2027', '2028', 'Not sure')),
  -- Deadline reminders for saved scholarships (email; WhatsApp also needs wa_opt_in).
  deadline_reminders boolean not null default true,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not wa_opt_in or (whatsapp is not null and wa_opt_in_at is not null))
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Records when WhatsApp consent is given or withdrawn (PDPA), whoever changes the flag.
create or replace function public.profiles_whatsapp_consent() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.wa_opt_in and (tg_op = 'INSERT' or not old.wa_opt_in) then
    new.wa_opt_in_at = now();
    new.wa_opt_out_at = null;
  elsif not new.wa_opt_in and tg_op = 'UPDATE' and old.wa_opt_in then
    new.wa_opt_out_at = now();
  end if;
  if new.whatsapp is null then
    new.wa_opt_in = false;
  end if;
  return new;
end;
$$;
create trigger profiles_whatsapp_consent before insert or update on public.profiles
  for each row execute function public.profiles_whatsapp_consent();

create table public.saved (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  scholarship_id text not null references public.scholarships (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, scholarship_id)
);

create table public.checklists (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Null for a checklist not yet linked to a scholarship.
  scholarship_id text references public.scholarships (id) on delete set null,
  application_type public.application_type not null default 'scholarship',
  level public.level_code,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index checklists_user_scholarship_idx on public.checklists (user_id, scholarship_id);
create trigger checklists_updated_at before update on public.checklists
  for each row execute function public.set_updated_at();

create table public.checklist_items (
  checklist_id bigint not null references public.checklists (id) on delete cascade,
  -- Item ids from the checklist content, e.g. "A1", "F10".
  item_id text not null check (item_id ~ '^[A-I]\d{1,2}$'),
  state public.checklist_item_state,
  note text,
  updated_at timestamptz not null default now(),
  primary key (checklist_id, item_id)
);
create trigger checklist_items_updated_at before update on public.checklist_items
  for each row execute function public.set_updated_at();

-- "I meet this" answers on a scholarship's eligibility self-check.
create table public.eligibility_answers (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  scholarship_id text not null references public.scholarships (id) on delete cascade,
  answers jsonb not null default '{}' check (jsonb_typeof(answers) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, scholarship_id)
);
create trigger eligibility_answers_updated_at before update on public.eligibility_answers
  for each row execute function public.set_updated_at();

create table public.reminders (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  scholarship_id text not null references public.scholarships (id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  -- Closing date the 7-day email reminder was sent for, so the daily job sends it once per deadline.
  notified_for date,
  -- Secret used in the reminder email's "Stop this reminder" link.
  token uuid not null default gen_random_uuid() unique,
  primary key (user_id, scholarship_id)
);

-- Emails the student opened in their own mail app (ScholarPath never sends them). Only the subject is
-- kept, not the message.
create table public.outreach (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Made on the device that logged it, so the same entry is matched across devices.
  client_id uuid not null,
  scholarship_id text references public.scholarships (id) on delete set null,
  recipient_type public.outreach_recipient not null,
  university_name text,
  recipient_name text,
  recipient_email text,
  purpose public.outreach_purpose not null,
  subject text not null,
  sent_at timestamptz not null default now(),
  status public.outreach_status not null default 'awaiting',
  followed_up_at timestamptz,
  replied_at timestamptz,
  unique (user_id, client_id)
);
create index outreach_user_idx on public.outreach (user_id, sent_at desc);

-- AI email drafts per user per day (Sri Lanka date), for the 20-a-day limit. Server only.
create table public.ai_draft_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, day)
);

-- Takes one draft from today's allowance; returns false when it's used up. Atomic, so parallel
-- requests can't go over the limit.
create or replace function public.take_ai_draft(p_user uuid, p_day date, p_limit integer) returns boolean
language sql set search_path = '' as $$
  with taken as (
    insert into public.ai_draft_usage as u (user_id, day, count) values (p_user, p_day, 1)
    on conflict (user_id, day) do update set count = u.count + 1 where u.count < p_limit
    returning 1
  )
  select exists (select 1 from taken);
$$;

-- Gives a draft back when the model call failed, so outages don't use up the allowance.
create or replace function public.give_back_ai_draft(p_user uuid, p_day date) returns void
language sql set search_path = '' as $$
  update public.ai_draft_usage set count = count - 1 where user_id = p_user and day = p_day and count > 0;
$$;
revoke all on function public.take_ai_draft(uuid, date, integer), public.give_back_ai_draft(uuid, date) from public, anon, authenticated;
grant execute on function public.take_ai_draft(uuid, date, integer), public.give_back_ai_draft(uuid, date) to service_role;

-- "Notify me when it reopens" requests. Written and read only by the server (service role): visitors
-- don't need an account, so there is no public policy. Pending = not yet notified and not unsubscribed.
create table public.reopen_alerts (
  id bigint generated always as identity primary key,
  scholarship_id text not null references public.scholarships (id) on delete cascade,
  email text not null check (length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  user_id uuid references auth.users (id) on delete cascade,
  -- Explicit consent ticked on the form (PDPA); the row isn't created without it.
  consent_at timestamptz not null default now(),
  -- Secret used in the unsubscribe link.
  token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unsubscribed_at timestamptz,
  unique (scholarship_id, email)
);
create index reopen_alerts_pending_idx on public.reopen_alerts (scholarship_id)
  where notified_at is null and unsubscribed_at is null;

-- ---------------------------------------------------------------- security

alter table public.destinations enable row level security;
alter table public.disciplines enable row level security;
alter table public.universities enable row level security;
alter table public.rankings enable row level security;
alter table public.scholarships enable row level security;
alter table public.scholarship_universities enable row level security;
alter table public.verification_log enable row level security;
alter table public.reopen_alerts enable row level security;
alter table public.profiles enable row level security;
alter table public.saved enable row level security;
alter table public.checklists enable row level security;
alter table public.checklist_items enable row level security;
alter table public.eligibility_answers enable row level security;
alter table public.reminders enable row level security;
alter table public.outreach enable row level security;
alter table public.ai_draft_usage enable row level security;

-- Content: anyone can read; only the service role (which bypasses RLS) writes.
create policy "Content is public" on public.destinations for select to anon, authenticated using (true);
create policy "Content is public" on public.disciplines for select to anon, authenticated using (true);
create policy "Content is public" on public.universities for select to anon, authenticated using (true);
create policy "Content is public" on public.rankings for select to anon, authenticated using (true);
create policy "Content is public" on public.scholarships for select to anon, authenticated using (true);
create policy "Content is public" on public.scholarship_universities for select to anon, authenticated using (true);
-- verification_log, reopen_alerts, ai_draft_usage: no policies, so only the service role can read or write them.

-- User tables: own rows only.
create policy "Own profile" on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Own saved" on public.saved for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own checklists" on public.checklists for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own checklist items" on public.checklist_items for all to authenticated
  using (exists (select 1 from public.checklists c where c.id = checklist_id and c.user_id = (select auth.uid())))
  with check (exists (select 1 from public.checklists c where c.id = checklist_id and c.user_id = (select auth.uid())));
create policy "Own eligibility answers" on public.eligibility_answers for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own reminders" on public.reminders for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own outreach" on public.outreach for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Explicit grants, so the Data API works whether or not the project grants new tables by default.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.destinations, public.disciplines, public.universities, public.rankings,
  public.current_rankings, public.scholarships, public.scholarship_universities to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.saved, public.checklists, public.checklist_items,
  public.eligibility_answers, public.reminders, public.outreach to authenticated;
grant all on all tables in schema public to service_role;
grant usage on all sequences in schema public to authenticated, service_role;

-- A profile row for every new account (filled in by the registration steps).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}');
  wa text := meta ->> 'whatsapp';
begin
  -- Registration step 1 sends these as sign-up metadata. Anything malformed is dropped, not stored.
  if wa is not null and wa !~ '^\+[1-9]\d{6,14}$' then
    wa := null;
  end if;
  insert into public.profiles (id, name, role, whatsapp, wa_opt_in, terms_accepted_at)
  values (
    new.id,
    left(coalesce(meta ->> 'name', meta ->> 'full_name', ''), 200),
    case when meta ->> 'role' in ('Student', 'Parent', 'Adviser / counsellor') then meta ->> 'role' else 'Student' end,
    wa,
    wa is not null and coalesce((meta ->> 'wa_opt_in')::boolean, false),
    case when coalesce((meta ->> 'terms')::boolean, false) then now() end
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
