import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Privacy" };

export default function Page() {
  return <PlaceholderPage title="Privacy" phase={10} />;
}
