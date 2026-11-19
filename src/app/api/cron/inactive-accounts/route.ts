import { cronAuthorized, runInactiveAccounts } from "@/lib/jobs";

// One daily job, also run by /api/cron/daily. Callable on its own for testing (same CRON_SECRET).
export async function GET(request: Request) {
  if (!cronAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { status, body } = await runInactiveAccounts();
  return Response.json(body, { status });
}
