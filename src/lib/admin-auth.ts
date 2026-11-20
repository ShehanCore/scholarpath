// Admin sign-in for /admin until accounts have an admin role. The login is ADMIN_USER / ADMIN_PASSWORD
// (Vercel environment variables); without them the admin is closed. Signing in sets a signed cookie for
// 12 hours. The signature uses the password, so changing the password in Vercel signs everyone out.
// Web Crypto only, so this runs in the proxy and in server actions alike.

export const ADMIN_COOKIE = "sp_admin";
export const ADMIN_SESSION_SECONDS = 12 * 60 * 60;

// Spaces around a value (easy to paste into Vercel by accident) are ignored; Unicode is compared in one form.
const clean = (s: string | undefined | null) => (s ?? "").normalize("NFC").trim();

function credentials() {
  const user = clean(process.env.ADMIN_USER);
  const password = clean(process.env.ADMIN_PASSWORD);
  return user && password ? { user, password } : null;
}

export function adminConfigured(): boolean {
  return credentials() !== null;
}

/** Compares strings in time independent of where they differ. */
function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/** The user name when the typed login matches ADMIN_USER / ADMIN_PASSWORD, else null. */
export function checkAdminLogin(user: string, password: string): string | null {
  const c = credentials();
  if (!c) return null;
  const okUser = safeEqual(clean(user), c.user);
  const okPassword = safeEqual(clean(password), c.password);
  return okUser && okPassword ? c.user : null;
}

const enc = new TextEncoder();

function base64url(bytes: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(data: string, c: { user: string; password: string }): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(`scholarpath-admin\u0000${c.user}\u0000${c.password}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

/** Cookie value for a signed-in admin: "expiry.signature". */
export async function createAdminSession(now = Date.now()): Promise<string | null> {
  const c = credentials();
  if (!c) return null;
  const expires = String(now + ADMIN_SESSION_SECONDS * 1000);
  return `${expires}.${await sign(expires, c)}`;
}

/** The admin user name for a valid, unexpired session cookie, else null. */
export async function readAdminSession(token: string | undefined | null, now = Date.now()): Promise<string | null> {
  const c = credentials();
  if (!c || !token) return null;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || !/^\d+$/.test(expires) || Number(expires) < now) return null;
  return safeEqual(signature, await sign(expires, c)) ? c.user : null;
}

/** Where to go after signing in: only pages inside /admin. */
export function safeAdminNext(next: string | null | undefined): string {
  return next && /^\/admin(\/[\w\-/]*)?$/.test(next) && next !== "/admin/login" ? next : "/admin";
}
