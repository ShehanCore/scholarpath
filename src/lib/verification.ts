import type { Scholarship } from "@/lib/content/types";

export type VerificationChip = {
  tone: "verified" | "warning" | "sample";
  label: string;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "22 Oct 2026" from an ISO date, as in the prototype (fixed month names; Intl writes "Sept" in some locales). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/**
 * The chip shown next to "Verify on the official website" (CLAUDE.md). A record still awaiting a human check
 * shows the warning tone even if its dates were marked checked (BUILD_PLAN correction 8).
 */
export function verificationChip(
  s: Pick<Scholarship, "verificationStatus" | "lastVerified" | "humanCheckNote">,
): VerificationChip {
  if (s.verificationStatus === "sample") return { tone: "sample", label: "Sample data" };
  if (s.verificationStatus === "expected_or_to_confirm" || s.humanCheckNote)
    return { tone: "warning", label: "Dates expected · to confirm" };
  return { tone: "verified", label: `Dates checked ${formatDate(s.lastVerified)}` };
}
