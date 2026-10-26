import { unsubscribeAlert, unsubscribeKind } from "@/lib/unsubscribe";

// One-click unsubscribe (RFC 8058) used by mail apps' "Unsubscribe" button.
export async function POST(request: Request) {
  const params = new URL(request.url).searchParams;
  const ok = await unsubscribeAlert(params.get("token") ?? "", unsubscribeKind(params.get("type")));
  return new Response(ok ? "Unsubscribed" : "Not found", { status: ok ? 200 : 404 });
}
