import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlaceholderPage } from "@/components/placeholder-page";
import { designScholarships } from "@/lib/content/design-data";
import { getScholarship } from "@/lib/db/queries";

export function generateStaticParams() {
  return designScholarships().map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/scholarships/[id]">): Promise<Metadata> {
  const s = await getScholarship((await params).id);
  return s ? { title: s.name } : {};
}

// Placeholder until the detail page (Phase 5).
export default async function Page({ params }: PageProps<"/scholarships/[id]">) {
  const s = await getScholarship((await params).id);
  if (!s) notFound();
  return <PlaceholderPage title={s.name} phase={5} />;
}
