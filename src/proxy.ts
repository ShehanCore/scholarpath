import { NextResponse, type NextRequest } from "next/server";
import { adminConfigured, checkAdminAuth } from "@/lib/admin-auth";

// Guards /admin (pages and the server actions they post) with HTTP Basic auth.
export function proxy(request: NextRequest) {
  if (!adminConfigured()) return new NextResponse("Not found", { status: 404 });
  if (checkAdminAuth(request.headers.get("authorization"))) return NextResponse.next();
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="ScholarPath admin", charset="UTF-8"', "Cache-Control": "no-store" },
  });
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
