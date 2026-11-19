import { cronAuthorized, runDeadlineReminders, runInactiveAccounts, runReopenAlerts } from "@/lib/jobs";

// Vercel Cron (vercel.json) calls this once a day and it runs every daily job in turn, so the project
// needs a single cron entry.
export async function GET(request: Request) {
  if (!cronAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const results: Record<string, unknown> = {};
  for (const [name, job] of [
    ["reopenAlerts", runReopenAlerts],
    ["deadlineReminders", runDeadlineReminders],
    ["inactiveAccounts", runInactiveAccounts],
  ] as const) {
    try {
      results[name] = (await job()).body;
    } catch (e) {
      results[name] = { error: e instanceof Error ? e.message : String(e) };
    }
  }
  return Response.json(results);
}
