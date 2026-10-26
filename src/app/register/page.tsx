import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Register" };

export default function Page() {
  return <PlaceholderPage title="Register" phase={7} />;
}
