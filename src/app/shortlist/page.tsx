import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "My shortlist" };

export default function Page() {
  return <PlaceholderPage title="My shortlist" phase={8} />;
}
