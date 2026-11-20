import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminConfigured, readAdminSession } from "@/lib/admin-auth";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) return adminGate(request);
  return refreshSession(request);
}

// /admin (pages and the server actions they post): signed-in admins only; everyone else goes to the
// sign-in page. Closed (404) until ADMIN_USER and ADMIN_PASSWORD are set.
async function adminGate(request: NextRequest) {
  if (!adminConfigured()) return new NextResponse("Not found", { status: 404 });
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  if (await readAdminSession(request.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.next();
  const login = request.nextUrl.clone();
  login.pathname = "/admin/login";
  login.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
  return NextResponse.redirect(login);
}

// Account pages: refresh the Supabase session cookie before the page renders, and send signed-out
// visitors to log in. Content pages stay static and don't run this.
async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  if (!data.user && request.nextUrl.pathname.startsWith("/account")) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = { matcher: ["/admin", "/admin/:path*", "/account", "/account/:path*"] };
