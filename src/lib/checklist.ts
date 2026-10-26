// Pre-submission checklist: content (design/data/checklist.json), visibility and scoring rules from
// design/README.md "Checklist". Pure functions; the UI and storage live in components.
import checklistJson from "../../design/data/checklist.json";
import type { LevelCode, Scholarship } from "@/lib/content/types";

export type AppType = "scholarship" | "grant";
export type ItemState = "done" | "needs" | "na";
export type Quality = (typeof QUALITIES)[number];

export const QUALITIES = ["Fit", "Evidence", "Clarity", "Feasibility", "Impact"] as const;

export type ChecklistItem = { id: string; text: string; tip: string };
export type ChecklistSection = {
  letter: string;
  title: string;
  short: string;
  quality: Quality;
  /** Section F: only for research grants, MPhil & Postgraduate, or PhD. */
  researchOnly: boolean;
  items: ChecklistItem[];
};

export const SECTIONS: ChecklistSection[] = checklistJson.sections.map((s) => ({
  letter: s.l,
  title: s.t,
  short: s.s,
  quality: s.q as Quality,
  researchOnly: "f" in s && Boolean(s.f),
  items: s.items.map(([text, tip], i) => ({ id: `${s.l}${i}`, text, tip })),
}));

export const COMMITTEE_QUESTION: Record<AppType, string> = {
  scholarship: checklistJson.committeeQuestion.scholarship,
  grant: checklistJson.committeeQuestion.grant,
};

/** A checklist in progress. `items` maps item id ("A0") to its state; unanswered items are absent. */
export type Checklist = {
  type: AppType | null;
  level: LevelCode | null;
  items: Record<string, ItemState>;
  notes: Record<string, string>;
};

export const blankChecklist = (): Checklist => ({ type: null, level: null, items: {}, notes: {} });

/** Setup pre-filled from a scholarship page: research grant or scholarship, and its first level. */
export function prefill(s: Pick<Scholarship, "awardType" | "levels">): Checklist {
  return { ...blankChecklist(), type: s.awardType === "Research grant" ? "grant" : "scholarship", level: s.levels[0] ?? null };
}

export function showsResearchSection(c: Pick<Checklist, "type" | "level">): boolean {
  return c.type === "grant" || c.level === "R" || c.level === "P";
}

export function visibleSections(c: Pick<Checklist, "type" | "level">): ChecklistSection[] {
  return SECTIONS.filter((s) => !s.researchOnly || showsResearchSection(c));
}

export type QualityBar = { quality: Quality; pct: number; label: string };

/**
 * Readiness: % = Done ÷ applicable items, where N/A items are excluded (unanswered still count as
 * applicable). Each quality bar uses the same formula over its own sections.
 */
export function checklistStats(c: Checklist) {
  const sections = visibleSections(c);
  let total = 0;
  let answered = 0;
  let needs = 0;
  let applicable = 0;
  let done = 0;
  const q = Object.fromEntries(QUALITIES.map((k) => [k, { done: 0, applicable: 0, present: false }])) as Record<
    Quality,
    { done: number; applicable: number; present: boolean }
  >;
  for (const sec of sections) {
    for (const it of sec.items) {
      const v = c.items[it.id];
      total++;
      q[sec.quality].present = true;
      if (v) answered++;
      if (v === "needs") needs++;
      if (v !== "na") {
        applicable++;
        q[sec.quality].applicable++;
      }
      if (v === "done") {
        done++;
        q[sec.quality].done++;
      }
    }
  }
  const pct = applicable ? Math.round((done / applicable) * 100) : 0;
  const bars: QualityBar[] = QUALITIES.map((k) => {
    const x = q[k];
    const p = x.applicable ? Math.round((x.done / x.applicable) * 100) : 0;
    return {
      quality: k,
      pct: p,
      label: !x.present ? "Not part of this application" : x.applicable ? `${p}% · ${x.done} of ${x.applicable}` : "All N/A",
    };
  });
  return { pct, bars, answered, total, needs, sections };
}

/** Items marked "Needs work", in order, with where they are. */
export function needsWork(c: Checklist) {
  return visibleSections(c).flatMap((sec, sectionIndex) =>
    sec.items
      .filter((it) => c.items[it.id] === "needs")
      .map((it) => ({ ...it, sectionIndex, where: `${sec.letter} · ${sec.title} · ${sec.quality}`, note: c.notes[it.id] ?? "" })),
  );
}

export type CommitteeRow = { factor: string; value: string; strong: boolean };

/** "What this committee weighs most" for the application type. */
export function committeeRows(type: AppType | null): CommitteeRow[] {
  return checklistJson.committeeWeights.map((r) => {
    const value = type === "grant" ? r.researchGrant : r.scholarship;
    return { factor: r.factor, value, strong: /very important|essential|major|required/i.test(value) };
  });
}

// ---- Share with mentor: the summary travels in the link's #fragment, which never reaches a server.

export type SharedSummary = Checklist & { scholarshipId: string | null };

const STATE_CODE: Record<ItemState, string> = { done: "d", needs: "n", na: "a" };
const CODE_STATE: Record<string, ItemState> = { d: "done", n: "needs", a: "na" };

export function encodeShare(s: SharedSummary): string {
  const json = JSON.stringify({
    v: 1,
    s: s.scholarshipId,
    t: s.type,
    l: s.level,
    i: Object.fromEntries(Object.entries(s.items).map(([k, v]) => [k, STATE_CODE[v]])),
    n: s.notes,
  });
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShare(code: string): SharedSummary | null {
  try {
    const bin = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
    const json = new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
    const o = JSON.parse(json) as { v: number; s: unknown; t: unknown; l: unknown; i: unknown; n: unknown };
    if (o.v !== 1) return null;
    const ids = new Set(SECTIONS.flatMap((s) => s.items.map((it) => it.id)));
    const items: Record<string, ItemState> = {};
    for (const [k, v] of Object.entries(o.i && typeof o.i === "object" ? o.i : {}))
      if (ids.has(k) && typeof v === "string" && CODE_STATE[v]) items[k] = CODE_STATE[v];
    const notes: Record<string, string> = {};
    for (const [k, v] of Object.entries(o.n && typeof o.n === "object" ? o.n : {}))
      if (ids.has(k) && typeof v === "string") notes[k] = v.slice(0, 2000);
    return {
      scholarshipId: typeof o.s === "string" ? o.s : null,
      type: o.t === "grant" || o.t === "scholarship" ? o.t : null,
      level: o.l === "B" || o.l === "M" || o.l === "R" || o.l === "P" ? o.l : null,
      items,
      notes,
    };
  } catch {
    return null;
  }
}
