import taxonomy from "../../design/data/taxonomy.json";

// Disciplines and levels are fixed taxonomy (THE subject areas), read from the design export at build time.
export type LevelCode = keyof typeof taxonomy.levels;

export const levelSlugs: Record<LevelCode, string> = {
  B: "bachelors",
  M: "masters",
  R: "mphil-postgraduate",
  P: "phd",
};

export const levelSubtitles: Record<LevelCode, string> = {
  B: "Undergraduate degrees",
  M: "Taught: MSc, MA, MBA, LLM",
  R: "MPhil, Master's by Research, PG Diploma, research student",
  P: "Doctoral, incl. DPhil and professional doctorates",
};

export const levels = (Object.keys(taxonomy.levels) as LevelCode[]).map((code) => ({
  code,
  name: taxonomy.levels[code],
  slug: levelSlugs[code],
  sub: levelSubtitles[code],
}));

export function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const disciplines = taxonomy.disciplines.map((d) => ({ ...d, slug: slugify(d.name) }));
