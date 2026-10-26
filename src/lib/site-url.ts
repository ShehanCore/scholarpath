/** Public site URL for links in emails, e.g. https://scholarpath.lk (no trailing slash). */
export function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}
