// Merging what a visitor did on this device (localStorage) with their account, at sign-in.
// Pure functions; components/account-sync.tsx does the I/O. Nothing is ever dropped: saved items and
// eligibility answers are unions, and for checklists this device's answers win item by item.
import type { Checklist, ItemState } from "@/lib/checklist";
import type { OutreachEntry } from "@/lib/outreach";

export function mergeSaved(local: string[], remote: string[]) {
  const all = [...new Set([...remote, ...local])];
  return { all, toUpload: local.filter((id) => !remote.includes(id)) };
}

export type EligibilityMap = Record<string, number[]>;

export function mergeEligibility(local: EligibilityMap, remote: EligibilityMap): EligibilityMap {
  const out: EligibilityMap = {};
  for (const id of new Set([...Object.keys(local), ...Object.keys(remote)]))
    out[id] = [...new Set([...(remote[id] ?? []), ...(local[id] ?? [])])].sort((a, b) => a - b);
  return out;
}

/** {"0": true, "2": true} (database) ↔ [0, 2] (browser). */
export const answersToIndexes = (a: Record<string, boolean>) =>
  Object.entries(a)
    .filter(([, v]) => v)
    .map(([k]) => Number(k))
    .filter(Number.isInteger)
    .sort((x, y) => x - y);
export const indexesToAnswers = (ix: number[]) => Object.fromEntries(ix.map((i) => [String(i), true]));

export function mergeChecklist(local: Checklist | undefined, remote: Checklist | undefined): Checklist | undefined {
  if (!local || !remote) return local ?? remote;
  return {
    type: local.type ?? remote.type,
    level: local.level ?? remote.level,
    items: { ...remote.items, ...local.items },
    notes: { ...remote.notes, ...Object.fromEntries(Object.entries(local.notes).filter(([, v]) => v)) },
  };
}

export function mergeChecklists(local: Record<string, Checklist>, remote: Record<string, Checklist>) {
  const out: Record<string, Checklist> = {};
  for (const id of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const merged = mergeChecklist(local[id], remote[id]);
    if (merged) out[id] = merged;
  }
  return out;
}

type ItemRow = { item_id: string; state: ItemState | null; note: string | null };

/** Database rows for one checklist's items: one per item with a state or a note. */
export function checklistToItemRows(c: Checklist): ItemRow[] {
  const ids = new Set([...Object.keys(c.items), ...Object.keys(c.notes).filter((k) => c.notes[k])]);
  return [...ids].sort().map((item_id) => ({ item_id, state: c.items[item_id] ?? null, note: c.notes[item_id] || null }));
}

export function itemRowsToChecklist(base: Pick<Checklist, "type" | "level">, rows: ItemRow[]): Checklist {
  const items: Checklist["items"] = {};
  const notes: Checklist["notes"] = {};
  for (const r of rows) {
    if (r.state) items[r.item_id] = r.state;
    if (r.note) notes[r.item_id] = r.note;
  }
  return { ...base, items, notes };
}

/** Saved ids added and removed between two snapshots. */
export function diffIds(before: string[], after: string[]) {
  return { added: after.filter((x) => !before.includes(x)), removed: before.filter((x) => !after.includes(x)) };
}

// ---- Email log (outreach table) ↔ OutreachEntry

type OutreachRow = {
  client_id: string;
  scholarship_id: string | null;
  recipient_type: OutreachEntry["to"];
  university_name: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  purpose: OutreachEntry["purpose"];
  subject: string;
  sent_at: string;
  status: OutreachEntry["status"];
};

export function outreachToRow(e: OutreachEntry): OutreachRow {
  return {
    client_id: e.id,
    scholarship_id: e.scholarshipId,
    recipient_type: e.to,
    university_name: e.university || null,
    recipient_name: e.name || null,
    recipient_email: e.email || null,
    purpose: e.purpose,
    subject: e.subject,
    sent_at: e.sentAt,
    status: e.status,
  };
}

export function rowToOutreach(r: OutreachRow): OutreachEntry | null {
  if (!r.scholarship_id) return null;
  return {
    id: r.client_id,
    scholarshipId: r.scholarship_id,
    to: r.recipient_type,
    university: r.university_name ?? "",
    name: r.recipient_name ?? "",
    email: r.recipient_email ?? "",
    purpose: r.purpose,
    subject: r.subject,
    sentAt: r.sent_at.slice(0, 10),
    status: r.status,
  };
}
