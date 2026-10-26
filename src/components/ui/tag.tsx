import type { ReactNode } from "react";

export function Tag({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "teal" | "navy" }) {
  if (tone === "teal")
    return (
      <span className="flex min-h-[30px] items-center gap-1.5 rounded-pill border-[1.5px] border-teal px-3 py-1 text-xs font-semibold text-teal">
        <span aria-hidden="true" className="block size-1.5 rounded-full bg-teal" />
        {children}
      </span>
    );
  return (
    <span
      className={`flex min-h-[30px] items-center rounded-pill px-3 py-1 text-xs ${
        tone === "navy" ? "bg-navy font-semibold text-white" : "bg-surface-4 font-medium"
      }`}
    >
      {children}
    </span>
  );
}
