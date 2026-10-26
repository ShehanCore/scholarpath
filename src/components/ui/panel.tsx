import type { ReactNode } from "react";

/** White rounded section used throughout the prototype. */
export function Panel({
  children,
  className = "",
  as: Tag = "section",
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div";
  labelledBy?: string;
}) {
  return (
    <Tag aria-labelledby={labelledBy} className={`rounded-card-lg bg-surface p-[clamp(16px,2.4vw,28px)] ${className}`}>
      {children}
    </Tag>
  );
}

/** Section title row: heading on the left, note or action on the right. */
export function PanelHeader({
  id,
  title,
  aside,
  className = "mb-4",
}: {
  id?: string;
  title: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-baseline justify-between gap-3 ${className}`}>
      <h2 id={id} className="m-0 font-heading text-2xl font-semibold">
        {title}
      </h2>
      {aside}
    </div>
  );
}

export function MonoNote({ children }: { children: ReactNode }) {
  return <span className="font-mono text-xs font-medium text-muted">{children}</span>;
}

/** Small uppercase eyebrow label. */
export function Eyebrow({ children, className = "text-teal" }: { children: ReactNode; className?: string }) {
  return <p className={`m-0 text-xs font-semibold uppercase tracking-[.08em] ${className}`}>{children}</p>;
}
