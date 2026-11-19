/** Public site URL for links in emails, e.g. https://scholarpath.lk (no trailing slash). */
export function siteUrl(): string {
  // On Vercel, VERCEL_PROJECT_PRODUCTION_URL is the production domain (VERCEL_URL is one deployment's own URL).
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? (host ? `https://${host}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}
