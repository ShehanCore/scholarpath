// Matching rows of a rankings CSV (names as THE publishes them) to ScholarPath universities.
import { normaliseTheRank } from "../src/lib/rank";

/** THE's institution name for universities whose ScholarPath name is a short form. */
export const theNames: Record<string, string> = {
  "australian-national-university-anu": "Australian National University",
  "university-of-technology-sydney-uts": "University of Technology Sydney",
  "university-of-western-australia-uwa": "University of Western Australia",
  alberta: "University of Alberta",
  calgary: "University of Calgary",
  mcgill: "McGill University",
  mcmaster: "McMaster University",
  ottawa: "University of Ottawa",
  ubc: "University of British Columbia",
  waterloo: "University of Waterloo",
  western: "Western University",
  basel: "University of Basel",
  bern: "University of Bern",
  epfl: "École Polytechnique Fédérale de Lausanne",
  geneva: "University of Geneva",
  lausanne: "University of Lausanne",
  fudan: "Fudan University",
  nanjing: "Nanjing University",
  peking: "Peking University",
  "shanghai-jiao-tong": "Shanghai Jiao Tong University",
  tsinghua: "Tsinghua University",
  ustc: "University of Science and Technology of China",
  zhejiang: "Zhejiang University",
  bonn: "University of Bonn",
  "charite-berlin": "Charité - Universitätsmedizin Berlin",
  "fu-berlin": "Free University of Berlin",
  hamburg: "University of Hamburg",
  heidelberg: "Heidelberg University",
  "humboldt-berlin": "Humboldt University of Berlin",
  "rwth-aachen": "RWTH Aachen University",
  "tu-munich": "Technical University of Munich",
  tubingen: "University of Tübingen",
  "london-school-of-economics-lse": "London School of Economics and Political Science",
  cuhk: "Chinese University of Hong Kong",
  cityu: "City University of Hong Kong",
  hku: "University of Hong Kong",
  hkust: "Hong Kong University of Science and Technology",
  polyu: "Hong Kong Polytechnic University",
  nagoya: "Nagoya University",
  osaka: "Osaka University",
  tohoku: "Tohoku University",
  "erasmus-rotterdam": "Erasmus University Rotterdam",
  groningen: "University of Groningen",
  leiden: "Leiden University",
  maastricht: "Maastricht University",
  radboud: "Radboud University Nijmegen",
  "tu-delft": "Delft University of Technology",
  "tu-eindhoven": "Eindhoven University of Technology",
  "vu-amsterdam": "Vrije Universiteit Amsterdam",
  wageningen: "Wageningen University & Research",
  ntu: "Nanyang Technological University, Singapore",
  nus: "National University of Singapore",
  caltech: "California Institute of Technology",
  harvard: "Harvard University",
  "johns-hopkins": "Johns Hopkins University",
  mit: "Massachusetts Institute of Technology",
  princeton: "Princeton University",
  stanford: "Stanford University",
  "uc-berkeley": "University of California, Berkeley",
  yale: "Yale University",
};

/** Lower-case, accent-free, punctuation-free form used to compare names. */
export function nameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type TheRow = { rank: string; name: string; universityId?: string };
export type RankMatch = { universityId: string; theName: string; rank: string };

/**
 * Matches THE rows to universities by explicit id, THE name, or ScholarPath name.
 * Rows with a malformed rank are reported, never guessed.
 */
export function matchRanks(rows: TheRow[], universities: { id: string; name: string }[]) {
  const idByKey = new Map<string, string>();
  for (const u of universities) {
    idByKey.set(nameKey(u.name), u.id);
    if (theNames[u.id]) idByKey.set(nameKey(theNames[u.id]), u.id);
  }
  const known = new Set(universities.map((u) => u.id));
  const matches: RankMatch[] = [];
  const badRank: TheRow[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const rank = normaliseTheRank(row.rank);
    const id = row.universityId && known.has(row.universityId) ? row.universityId : idByKey.get(nameKey(row.name));
    if (!id) continue;
    if (!rank) {
      badRank.push(row);
      continue;
    }
    if (seen.has(id)) throw new Error(`Two THE rows match "${id}"`);
    seen.add(id);
    matches.push({ universityId: id, theName: row.name, rank });
  }
  const unmatched = universities.filter((u) => !seen.has(u.id));
  return { matches, unmatched, badRank };
}

/** Minimal CSV parser (quoted fields, commas and doubled quotes inside quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") endField();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else field += c;
  }
  if (field || row.length) endRow();
  return rows.filter((r) => r.some((f) => f.trim()));
}
