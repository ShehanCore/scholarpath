import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Rankings note" };

export default function Page() {
  return <PlaceholderPage title="Rankings note" phase={10} />;
}
