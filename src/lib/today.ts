import { cacheLife } from "next/cache";
import { todayIso } from "@/lib/status";

/**
 * Today's date (Sri Lanka) for deadline status on cached pages. Cached for an hour, so a page's
 * statuses and "days left" can lag the real date by at most that long.
 */
export async function getToday(): Promise<string> {
  "use cache";
  cacheLife("hours");
  return todayIso();
}
