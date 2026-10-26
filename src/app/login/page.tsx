import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Log in" };

export default function Page() {
  return <PlaceholderPage title="Log in" phase={7} />;
}
