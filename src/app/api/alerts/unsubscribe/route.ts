import { unsubscribeAlert } from "@/lib/unsubscribe";

// One-click unsubscribe (RFC 8058) used by mail apps' "Unsubscribe" button.
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const ok = await unsubscribeAlert(token);
  return new Response(ok ? "Unsubscribed" : "Not found", { status: ok ? 200 : 404 });
}
