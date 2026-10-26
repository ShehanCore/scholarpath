export type NavItem = {
  label: string;
  /** Shorter label for the desktop bar, where space is tight. */
  shortLabel?: string;
  href: string;
  /** Path prefixes that mark this item as the current section. */
  match: string[];
};

// Order and labels follow `navDefs` in design/ScholarPath.dc.html.
export const mainNav: NavItem[] = [
  { label: "Find scholarships", href: "/scholarships", match: ["/scholarships"] },
  { label: "Destinations", href: "/destinations", match: ["/destinations", "/universities"] },
  { label: "Disciplines", href: "/disciplines/computer-science", match: ["/disciplines"] },
  { label: "Study levels", href: "/levels/masters", match: ["/levels"] },
  { label: "Application checklist", shortLabel: "Checklist", href: "/checklist", match: ["/checklist"] },
  { label: "Deadlines", href: "/deadlines", match: ["/deadlines"] },
];

export const savedHref = "/shortlist";

export const footerNav = [
  { label: "About", href: "/about" },
  { label: "How we verify scholarships", href: "/how-we-verify" },
  { label: "Rankings note", href: "/rankings-note" },
  { label: "Talk to an adviser", href: "/adviser" },
  { label: "Privacy", href: "/privacy" },
];

export function isActive(pathname: string, match: string[]) {
  return match.some((m) => pathname === m || pathname.startsWith(m + "/"));
}
