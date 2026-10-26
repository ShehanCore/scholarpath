"use client";

import { useEffect, useRef } from "react";
import type { Checklist } from "@/lib/checklist";
import { useAuthUser } from "@/lib/client/auth-store";
import { DRAFT, replaceChecklists, useAllChecklists } from "@/lib/client/checklist-store";
import { replaceEligibility, useAllEligibility } from "@/lib/client/eligibility-store";
import { replaceOutreach, useOutreach } from "@/lib/client/outreach-store";
import { replaceReminders, setReminder, useReminders } from "@/lib/client/reminder-store";
import { replaceSaved, useSaved } from "@/lib/client/saved-store";
import { mergeOutreach, type OutreachEntry } from "@/lib/outreach";
import { PENDING_PROFILE_KEY, type StudyProfile } from "@/lib/profile";
import { authAvailable, browserClient } from "@/lib/supabase/browser";
import {
  answersToIndexes,
  checklistToItemRows,
  diffIds,
  indexesToAnswers,
  itemRowsToChecklist,
  mergeChecklists,
  mergeEligibility,
  mergeSaved,
  outreachToRow,
  rowToOutreach,
} from "@/lib/sync";

type Supabase = ReturnType<typeof browserClient>;

/**
 * Keeps this device and the account in step while signed in: merges at sign-in, then writes each change
 * through (saved, checklists, eligibility, logged emails, reminders). On log out the device copy is cleared, so the next person on a shared phone doesn't see it.
 * The unlinked draft checklist stays on the device.
 */
export function AccountSync() {
  const user = useAuthUser();
  const saved = useSaved();
  const checklists = useAllChecklists();
  const eligibility = useAllEligibility();
  const outreach = useOutreach();
  const reminders = useReminders();
  const synced = useRef<{
    userId: string;
    saved: string[];
    checklists: Record<string, Checklist>;
    elig: Record<string, number[]>;
    outreach: OutreachEntry[];
    reminders: string[];
  } | null>(null);
  const wasSignedIn = useRef(false);
  // Registration's "Remind me about deadlines for scholarships I save": newly saved items get a reminder.
  const remindOnSave = useRef(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Sign-in: merge both ways once per user.
  useEffect(() => {
    if (!authAvailable || !user || checklists === null || outreach === null || synced.current?.userId === user.id) return;
    wasSignedIn.current = true;
    const db = browserClient();
    let cancelled = false;
    (async () => {
      await applyPendingProfile(db, user.id);
      const [rSaved, rElig, rChecklists, rItems, rOut, rRem, rProfile] = await Promise.all([
        db.from("saved").select("scholarship_id"),
        db.from("eligibility_answers").select("scholarship_id, answers"),
        db.from("checklists").select("id, scholarship_id, application_type, level"),
        db.from("checklist_items").select("checklist_id, item_id, state, note"),
        db.from("outreach").select("*"),
        db.from("reminders").select("scholarship_id"),
        db.from("profiles").select("deadline_reminders").eq("id", user.id).maybeSingle(),
      ]);
      remindOnSave.current = Boolean(rProfile.data?.deadline_reminders);
      if (cancelled || rSaved.error || rElig.error || rChecklists.error || rItems.error || rOut.error || rRem.error) return;

      const s = mergeSaved(saved, rSaved.data.map((r) => r.scholarship_id));
      if (s.toUpload.length) await db.from("saved").upsert(s.toUpload.map((scholarship_id) => ({ user_id: user.id, scholarship_id })));

      const remoteElig = Object.fromEntries(rElig.data.map((r) => [r.scholarship_id, answersToIndexes(r.answers)]));
      const e = mergeEligibility(eligibility, remoteElig);
      const eChanged = Object.keys(e).filter((id) => JSON.stringify(e[id]) !== JSON.stringify(remoteElig[id] ?? []));
      if (eChanged.length)
        await db
          .from("eligibility_answers")
          .upsert(eChanged.map((id) => ({ user_id: user.id, scholarship_id: id, answers: indexesToAnswers(e[id]) })));

      const remoteCk: Record<string, Checklist> = {};
      for (const c of rChecklists.data) {
        if (!c.scholarship_id) continue;
        remoteCk[c.scholarship_id] = itemRowsToChecklist(
          { type: c.application_type, level: c.level },
          rItems.data.filter((i) => i.checklist_id === c.id),
        );
      }
      const { [DRAFT]: draft, ...linked } = checklists;
      const merged = mergeChecklists(linked, remoteCk);
      for (const [id, c] of Object.entries(merged))
        if (JSON.stringify(c) !== JSON.stringify(remoteCk[id])) await pushChecklist(db, user.id, id, c);

      const remoteOut = rOut.data.map(rowToOutreach).filter((x): x is OutreachEntry => x !== null);
      const o = mergeOutreach(outreach, remoteOut);
      const oChanged = o.filter((x) => JSON.stringify(x) !== JSON.stringify(remoteOut.find((r) => r.id === x.id)));
      if (oChanged.length) await pushOutreach(db, user.id, oChanged);

      const r = mergeSaved(reminders, rRem.data.map((x) => x.scholarship_id));
      if (r.toUpload.length) await db.from("reminders").upsert(r.toUpload.map((scholarship_id) => ({ user_id: user.id, scholarship_id })));

      if (cancelled) return;
      synced.current = { userId: user.id, saved: s.all, checklists: merged, elig: e, outreach: o, reminders: r.all };
      replaceOutreach(o);
      replaceReminders(r.all);
      replaceSaved(s.all);
      replaceEligibility(e);
      replaceChecklists(draft ? { ...merged, [DRAFT]: draft } : merged);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, saved, checklists, eligibility, outreach, reminders]);

  // Signed in: write changes through.
  useEffect(() => {
    const snap = synced.current;
    if (!user || !snap || snap.userId !== user.id || checklists === null || outreach === null) return;
    const db = browserClient();
    const d = diffIds(snap.saved, saved);
    if (d.added.length) void db.from("saved").upsert(d.added.map((scholarship_id) => ({ user_id: user.id, scholarship_id })));
    if (d.removed.length) void db.from("saved").delete().eq("user_id", user.id).in("scholarship_id", d.removed);
    if (remindOnSave.current) for (const id of d.added) if (!reminders.includes(id)) setReminder(id, true);
    for (const id of Object.keys(eligibility))
      if (JSON.stringify(eligibility[id]) !== JSON.stringify(snap.elig[id] ?? []))
        void db.from("eligibility_answers").upsert({ user_id: user.id, scholarship_id: id, answers: indexesToAnswers(eligibility[id]) });
    for (const [id, c] of Object.entries(checklists)) {
      if (id === DRAFT || JSON.stringify(c) === JSON.stringify(snap.checklists[id])) continue;
      // Notes are typed letter by letter: wait for a pause before writing.
      clearTimeout(timers.current[id]);
      timers.current[id] = setTimeout(() => void pushChecklist(db, user.id, id, c), 800);
    }
    const oChanged = outreach.filter((x) => JSON.stringify(x) !== JSON.stringify(snap.outreach.find((y) => y.id === x.id)));
    if (oChanged.length) void pushOutreach(db, user.id, oChanged);
    const r = diffIds(snap.reminders, reminders);
    if (r.added.length) void db.from("reminders").upsert(r.added.map((scholarship_id) => ({ user_id: user.id, scholarship_id })));
    if (r.removed.length) void db.from("reminders").delete().eq("user_id", user.id).in("scholarship_id", r.removed);
    synced.current = { ...snap, saved, checklists, elig: eligibility, outreach, reminders };
  }, [user, saved, checklists, eligibility, outreach, reminders]);

  // Log out: clear this device's copy.
  useEffect(() => {
    if (user === null && wasSignedIn.current) {
      wasSignedIn.current = false;
      synced.current = null;
      replaceSaved([]);
      replaceEligibility({});
      replaceChecklists({});
      replaceOutreach([]);
      replaceReminders([]);
    }
  }, [user]);

  return null;
}

async function pushChecklist(db: Supabase, userId: string, scholarshipId: string, c: Checklist) {
  const { data, error } = await db
    .from("checklists")
    .upsert(
      { user_id: userId, scholarship_id: scholarshipId, application_type: c.type ?? "scholarship", level: c.level },
      { onConflict: "user_id,scholarship_id" },
    )
    .select("id")
    .single();
  if (error || !data) return;
  const rows = checklistToItemRows(c).map((r) => ({ ...r, checklist_id: data.id }));
  if (rows.length) await db.from("checklist_items").upsert(rows, { onConflict: "checklist_id,item_id" });
  const keep = rows.map((r) => r.item_id);
  const del = db.from("checklist_items").delete().eq("checklist_id", data.id);
  await (keep.length ? del.not("item_id", "in", `(${keep.join(",")})`) : del);
}

async function pushOutreach(db: Supabase, userId: string, entries: OutreachEntry[]) {
  await db.from("outreach").upsert(
    entries.map((e) => ({ ...outreachToRow(e), user_id: userId })),
    { onConflict: "user_id,client_id" },
  );
}

/** Study plans chosen before the email was confirmed (registration step 2), saved at first sign-in. */
async function applyPendingProfile(db: Supabase, userId: string) {
  let pending: StudyProfile | null = null;
  try {
    pending = JSON.parse(localStorage.getItem(PENDING_PROFILE_KEY) ?? "null");
  } catch {}
  if (!pending) return;
  const { error } = await db
    .from("profiles")
    .update({
      levels: pending.levels,
      disciplines: pending.disciplines,
      destinations: pending.destinations,
      nationality: pending.nationality,
      intake: pending.intake,
      deadline_reminders: pending.deadlineReminders,
    })
    .eq("id", userId);
  if (!error) localStorage.removeItem(PENDING_PROFILE_KEY);
}
