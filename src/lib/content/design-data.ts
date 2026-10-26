// Converts the design handoff's JSON exports (design/data/*.json) into domain records, applying the
// data corrections in design/BUILD_PLAN.md. Used by the seed generator and as the local content source
// when Supabase isn't configured.
import checklistJson from "../../../design/data/checklist.json";
import destinationsJson from "../../../design/data/destinations.json";
import scholarshipsJson from "../../../design/data/scholarships.json";
import universitiesJson from "../../../design/data/universities.json";
import { slugify } from "@/lib/taxonomy";
import type { Destination, LevelCode, Scholarship, University, VerificationStatus } from "./types";

const levelCodeByName: Record<string, LevelCode> = {
  "Bachelor's": "B",
  "Master's": "M",
  "MPhil & Postgraduate": "R",
  PhD: "P",
};

function levelCodes(names: string[]): LevelCode[] {
  return names.map((n) => {
    const code = levelCodeByName[n];
    if (!code) throw new Error(`Unknown level "${n}"`);
    return code;
  });
}

/** "22 Oct 2026" → "2026-10-22". */
function isoFromDisplay(d: string): string {
  const parsed = new Date(d + " UTC");
  if (Number.isNaN(parsed.getTime())) throw new Error(`Unparseable date "${d}"`);
  return parsed.toISOString().slice(0, 10);
}

// Correction 8: records a person must confirm before launch.
const humanChecks: Record<string, string> = {
  manaaki: "Sri Lanka may no longer be on the eligible country list.",
  miu: "Confirm the eligible country list.",
  singa: "No live official 2027 page found.",
  swiss: "The deadline is country-specific; confirm the Sri Lanka date.",
};
const VARIES_NOTE = "Deadline varies by university; confirm per institution.";

// Correction 1 also covers prose: funding amounts and "what it covers" are cut from summaries and
// deadline notes. Each entry is [original text, replacement]; the replacement must exist verbatim in the
// original minus the funding clause, so nothing new is written.
const fundingCuts: Record<string, { summary?: [string, string | null]; deadlineNote?: [string, string] }> = {
  chevening: { summary: [", with flights, tuition and a living allowance.", "."] },
  ireland: { summary: ["*", null] },
  daad: { summary: [": €992 a month for master's, €1,400 for doctoral, plus insurance and travel.", "."] },
  erasmus: { summary: [" Covers tuition and insurance, plus €1,400 a month for up to 24 months.", ""] },
  mgrs: { deadlineNote: [" About 600 a year: A$39,500 stipend plus full fee offset.", ""] },
  miu: { deadlineNote: ["20% fee remission from 2027 for citizens of listed lower-income countries", "For citizens of listed lower-income countries"] },
  holland: { deadlineNote: [" One-time €5,000 in your first year.", ""] },
  swiss: { deadlineNote: [" CHF 2,450 a month.", ""] },
  hkpfs: { deadlineNote: [" HK$344,400 a year.", ""] },
};

function cut(id: string, field: "summary" | "deadlineNote", text: string | null): string | null {
  const rule = fundingCuts[id]?.[field];
  if (!rule || !text) return text || null;
  const [from, to] = rule;
  if (from === "*") return to;
  if (!text.includes(from)) throw new Error(`Funding cut for ${id}.${field} no longer matches the source text`);
  return text.replace(from, to ?? "") || null;
}

export function designDestinations(): Destination[] {
  // Correction 5: open-scholarship and ranked-university counts are computed, so they aren't imported.
  return destinationsJson.map((d, i) => ({ code: d.code, name: d.name, why: d.why, sortOrder: i + 1 }));
}

export function designUniversities(): University[] {
  const base = { theRank: null, rankSourceUrl: null, rankRetrievedAt: null, websiteUrl: null, staffDirectoryUrl: null };
  // Correction 2: ranks in the handoff aren't trusted. Every university starts unranked until the THE import.
  const detailed: University[] = universitiesJson.detailed.map((u) => ({
    ...base,
    id: slugify(u.name),
    name: u.name,
    city: u.city,
    countryCode: u.country,
    levels: levelCodes(u.levels),
  }));
  const detailedCountries = new Set(detailed.map((u) => u.countryCode));
  const named: University[] = Object.entries(universitiesJson.namesByCountry)
    .filter(([country]) => !detailedCountries.has(country))
    .flatMap(([country, names]) =>
      names.map((name) => ({ ...base, id: slugify(name), name, city: null, countryCode: country, levels: [] })),
    );
  const all = [...detailed, ...named];
  const ids = new Set<string>();
  for (const u of all) {
    if (ids.has(u.id)) throw new Error(`Duplicate university id "${u.id}"`);
    ids.add(u.id);
  }
  return all;
}

export function designScholarships(): Scholarship[] {
  const universityIdByName = new Map(designUniversities().map((u) => [u.name, u.id]));
  const chevening = checklistJson.cheveningDetail;

  return scholarshipsJson.map((s): Scholarship => {
    let universityId: string | null = null;
    if (s.university) {
      universityId = universityIdByName.get(s.university) ?? null;
      if (!universityId) throw new Error(`Scholarship "${s.id}" names unknown university "${s.university}"`);
    }
    const varies = s.deadlineNote?.startsWith("Varies by university") ?? false;
    const isChevening = s.id === "chevening";

    // Correction 1: `funding` and `covers` are never imported.
    return {
      id: s.id,
      name: s.name,
      funder: s.funder,
      funderType: s.funderType,
      awardType: s.awardType,
      destinationCode: s.destination,
      universityId,
      levels: levelCodes(s.levels),
      disciplinesAll: s.disciplines === "Open to all",
      disciplines: Array.isArray(s.disciplines) ? s.disciplines : [],
      disciplineLabel: s.disciplineLabel,
      opens: s.opens,
      closes: s.closes,
      deadlineNote: cut(s.id, "deadlineNote", s.deadlineNote),
      awards: s.awards || null,
      summary: cut(s.id, "summary", s.summary),
      officialUrl: s.officialUrl,
      lastVerified: isoFromDisplay(s.lastVerified),
      verificationStatus: s.verificationStatus as VerificationStatus,
      humanCheckNote: humanChecks[s.id] ?? (varies ? VARIES_NOTE : null),
      // Correction 7: only Chevening has detail content; everyone else shows "Not published".
      eligibility: isChevening ? chevening.elig : null,
      documents: isChevening ? chevening.docs : null,
      timeline: isChevening ? chevening.steps.map(([label, when]) => ({ label, when })) : null,
      whereUsable: isChevening ? chevening.where : null,
    };
  });
}
