import type { Scholarship } from "@/lib/content/types";
import { verificationChip } from "@/lib/verification";

const tone = {
  verified: "bg-verified-bg text-verified-fg",
  warning: "bg-warning-bg text-warning-fg",
  sample: "bg-surface text-muted",
};

/** "Dates checked {date}" (teal), "Dates expected · to confirm" (warning) or "Sample data" (grey). */
export function VerificationChip({ s }: { s: Pick<Scholarship, "verificationStatus" | "lastVerified" | "humanCheckNote"> }) {
  const chip = verificationChip(s);
  return (
    <span className={`flex h-11 items-center rounded-pill px-3.5 font-mono text-xs font-medium ${tone[chip.tone]}`}>
      {chip.label}
    </span>
  );
}
