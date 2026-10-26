import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Deadlines" };

export default function Page() {
  return <PlaceholderPage title="Deadlines" phase={8} />;
}
