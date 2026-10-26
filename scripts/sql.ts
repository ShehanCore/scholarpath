// Tiny SQL literal helpers for the generated seed and rank files.
export function lit(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "'" + v.replace(/'/g, "''") + "'";
}

export function textArray(values: string[] | null): string {
  if (values === null) return "null";
  return values.length ? `array[${values.map(lit).join(", ")}]::text[]` : "'{}'::text[]";
}

export function enumArray(values: string[], type: string): string {
  return `'{${values.join(",")}}'::public.${type}[]`;
}

export function jsonb(v: unknown): string {
  return v === null ? "null" : `${lit(JSON.stringify(v))}::jsonb`;
}
