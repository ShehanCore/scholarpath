import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Pre-submission checklist" };

export default function Page() {
  return <PlaceholderPage title="Pre-submission checklist" phase={6} />;
}
