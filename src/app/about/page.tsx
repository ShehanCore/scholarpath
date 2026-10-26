import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "About" };

export default function Page() {
  return <PlaceholderPage title="About" phase={10} />;
}
