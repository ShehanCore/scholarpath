import taxonomy from "../../design/data/taxonomy.json";

// Phase 1 reads taxonomy straight from the design export; Phase 2 moves it to Supabase.
export type LevelCode = keyof typeof taxonomy.levels;

export const levelSlugs: Record<LevelCode, string> = {
  B: "bachelors",
  M: "masters",
  R: "mphil-postgraduate",
  P: "phd",
};

export const levels = (Object.keys(taxonomy.levels) as LevelCode[]).map((code) => ({
  code,
  name: taxonomy.levels[code],
  slug: levelSlugs[code],
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
