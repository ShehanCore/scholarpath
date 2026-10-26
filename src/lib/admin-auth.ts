// HTTP Basic auth for /admin until accounts with an admin role exist (Phase 7/10). Credentials come from
// ADMIN_USER and ADMIN_PASSWORD; without them the admin is closed.

/** Compares strings in time independent of where they differ. */
function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD);
}

/** Checks an Authorization header against ADMIN_USER / ADMIN_PASSWORD. Returns the user name, or null. */
export function checkAdminAuth(header: string | null): string | null {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;
  if (!user || !password || !header?.startsWith("Basic ")) return null;
  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return null;
  }
  const sep = decoded.indexOf(":");
  if (sep < 0) return null;
  const okUser = safeEqual(decoded.slice(0, sep), user);
  const okPassword = safeEqual(decoded.slice(sep + 1), password);
  return okUser && okPassword ? user : null;
}
