import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Destinations" };

export default function Page() {
  return <PlaceholderPage title="Destinations" phase={3} />;
}
