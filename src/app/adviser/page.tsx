import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Talk to an adviser" };

export default function Page() {
  return <PlaceholderPage title="Talk to an adviser" phase={10} />;
}
