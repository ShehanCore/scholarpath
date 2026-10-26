-- RLS and constraint tests. Each block raises an exception on failure.
-- Users: A = 0000…000a, B = 0000…000b.

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', '{"name": "Amaya Perera", "role": "Student", "whatsapp": "+94771234567", "wa_opt_in": true, "terms": true}'),
  ('00000000-0000-0000-0000-00000000000b', '{"whatsapp": "077 123", "wa_opt_in": true, "role": "Admin"}'),
  ('00000000-0000-0000-0000-00000000000c', '{"name": "Kasun", "whatsapp": "+94771112222"}');

do $$ begin
  assert (select name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'Amaya Perera',
    'new user gets a profile with their name';
  assert (select wa_opt_in from public.profiles where id = '00000000-0000-0000-0000-00000000000c') = false,
    'WhatsApp opt-in defaults to off, even with a number';
  assert (select wa_opt_in and wa_opt_in_at is not null and whatsapp = '+94771234567' and terms_accepted_at is not null
          from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 'sign-up metadata fills the profile and consent time';
  assert (select whatsapp is null and not wa_opt_in and role = 'Student' from public.profiles
          where id = '00000000-0000-0000-0000-00000000000b'), 'malformed number and role are dropped';
  update public.profiles set wa_opt_in = false where id = '00000000-0000-0000-0000-00000000000a';
  assert (select wa_opt_out_at is not null from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 'opt-out is timestamped';
  update public.profiles set wa_opt_in = true where id = '00000000-0000-0000-0000-00000000000a';
  assert (select wa_opt_out_at is null and wa_opt_in_at is not null from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 'opt back in';
end $$;

-- Seed facts
do $$ begin
  assert (select count(*) from public.scholarships) = 26, '26 scholarships';
  assert (select count(*) from public.rankings) = 20, '20 ranks from the brief (2 are "to confirm")';
  assert (select rank_display from public.current_rankings where university_id = 'ucl') = '=17', 'ties kept as published';
  assert (select rank_sort from public.current_rankings where university_id = 'ucl') = 17, 'rank_sort is numeric';
  assert not exists (select 1 from public.rankings where university_id = 'university-of-warwick'), 'unconfirmed rank has no row';
  assert (select university_id from public.scholarships where id = 'gates') = 'university-of-cambridge', 'Gates → Cambridge';
  assert (select human_check_note is not null from public.scholarships where id = 'manaaki'), 'Manaaki flagged';
  assert (select human_check_note is not null from public.scholarships where id = 'rtp'), '"Varies by university" flagged';
  assert (select eligibility is null from public.scholarships where id = 'gates'), 'no Chevening fallback content';
  assert (select cardinality(eligibility) = 5 from public.scholarships where id = 'chevening'), 'Chevening eligibility';
  assert (select count(*) from public.verification_log) = 26, 'one log entry per scholarship, not duplicated by re-seed';
end $$;

-- Constraints
do $$ begin
  begin
    update public.rankings set rank_sort = 18 where university_id = 'ucl';
    raise exception 'rank_sort that disagrees with rank_display was accepted';
  exception when check_violation then null;
  end;
  begin
    update public.rankings set rank_display = 'about 20' where university_id = 'ucl';
    raise exception 'malformed rank was accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.rankings (university_id, country_code, rank_display, rank_sort, year, source)
      values ('ucl', 'AU', '5', 5, 2026, 'x');
    raise exception 'rank with the wrong country was accepted';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.reopen_alerts (scholarship_id, email) values ('chevening', 'not-an-email');
    raise exception 'malformed alert email was accepted';
  exception when check_violation then null;
  end;
  update public.profiles set wa_opt_in = true where id = '00000000-0000-0000-0000-00000000000b';
  assert (select not wa_opt_in from public.profiles where id = '00000000-0000-0000-0000-00000000000b'), 'no opt-in without a number';
end $$;

-- anon: reads content, nothing else
set role anon;
do $$ begin
  assert (select count(*) from public.scholarships) = 26, 'anon reads scholarships';
  begin
    perform count(*) from public.profiles;
    raise exception 'anon read profiles';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.destinations (code, name, why) values ('XX', 'x', 'x');
    raise exception 'anon wrote content';
  exception when insufficient_privilege then null;
  end;
  begin
    perform count(*) from public.verification_log;
    raise exception 'anon read the verification log';
  exception when insufficient_privilege then null;
  end;
  begin
    perform count(*) from public.reopen_alerts;
    raise exception 'anon read reopen alerts';
  exception when insufficient_privilege then null;
  end;
  assert (select count(*) from public.current_rankings) = 20, 'anon reads current ranks';
end $$;
reset role;

-- User A writes their own rows
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.saved (scholarship_id) values ('chevening'), ('gates');
insert into public.checklists (scholarship_id, level) values ('chevening', 'M');
insert into public.checklist_items (checklist_id, item_id, state)
  select id, 'A1', 'done' from public.checklists where scholarship_id = 'chevening';
insert into public.outreach (client_id, recipient_type, purpose, subject) values ('6f1c0a9e-0000-4000-8000-000000000001', 'admissions', 'eligibility', 'Question');
insert into public.reminders (scholarship_id) values ('daad');
update public.profiles set levels = '{M,P}', destinations = '{GB}', intake = '2027';
do $$ begin
  assert (select count(*) from public.saved) = 2, 'A sees own saved';
  assert (select count(*) from public.reminders) = 1, 'A sees own reminder';
  begin
    insert into public.outreach (client_id, recipient_type, purpose, subject)
      values ('6f1c0a9e-0000-4000-8000-000000000001', 'admissions', 'eligibility', 'Again');
    raise exception 'duplicate client_id accepted';
  exception when unique_violation then null;
  end;
  begin
    perform public.take_ai_draft('00000000-0000-0000-0000-00000000000a', current_date, 20);
    raise exception 'a signed-in user called the AI quota function directly';
  exception when insufficient_privilege then null;
  end;
  begin
    perform count(*) from public.ai_draft_usage;
    raise exception 'a signed-in user read AI usage';
  exception when insufficient_privilege then null;
  end;
  assert (select count(*) from public.profiles) = 1, 'A sees only own profile';
  begin
    insert into public.saved (user_id, scholarship_id) values ('00000000-0000-0000-0000-00000000000b', 'daad');
    raise exception 'A saved a row for B';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.scholarships set name = 'x' where id = 'chevening';
    raise exception 'authenticated user edited content';
  exception when insufficient_privilege then null;
  end;
end $$;

-- User B sees none of A's rows and can't touch A's checklist
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$
declare a_checklist bigint;
begin
  assert (select count(*) from public.saved) = 0, 'B sees no saved rows of A';
  assert (select count(*) from public.checklists) = 0, 'B sees no checklists of A';
  assert (select count(*) from public.checklist_items) = 0, 'B sees no checklist items of A';
  assert (select count(*) from public.outreach) = 0, 'B sees no outreach of A';
  assert (select count(*) from public.reminders) = 0, 'B sees no reminders of A';
  assert (select count(*) from public.profiles) = 1, 'B sees only own profile';
  update public.profiles set name = 'hijack' where id = '00000000-0000-0000-0000-00000000000a';
  delete from public.saved where scholarship_id = 'chevening';
end $$;
reset role;

do $$
declare a_checklist bigint;
begin
  assert (select name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'Amaya Perera',
    'B could not rename A';
  assert (select count(*) from public.saved where user_id = '00000000-0000-0000-0000-00000000000a') = 2,
    'B could not delete A''s saved rows';
  select id into a_checklist from public.checklists where user_id = '00000000-0000-0000-0000-00000000000a';
  set local role authenticated;
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
  begin
    insert into public.checklist_items (checklist_id, item_id, state) values (a_checklist, 'B1', 'done');
    raise exception 'B wrote into A''s checklist';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- AI drafts: 20 a day per user, atomic; a failed call gives one back.
do $$
declare ok boolean; a uuid := '00000000-0000-0000-0000-00000000000a';
begin
  for i in 1..20 loop
    assert public.take_ai_draft(a, '2026-10-26', 20), 'draft ' || i || ' allowed';
  end loop;
  assert not public.take_ai_draft(a, '2026-10-26', 20), '21st draft refused';
  perform public.give_back_ai_draft(a, '2026-10-26');
  assert public.take_ai_draft(a, '2026-10-26', 20), 'given-back draft can be used';
  assert public.take_ai_draft(a, '2026-10-27', 20), 'new day, new allowance';
  assert (select count from public.ai_draft_usage where user_id = a and day = '2026-10-26') = 20, 'count stays at the limit';
end $$;
