import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlaceholderPage } from "@/components/placeholder-page";
import { levels } from "@/lib/taxonomy";

export function generateStaticParams() {
  return levels.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps<"/levels/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: levels.find((l) => l.slug === slug)?.name };
}

export default async function Page({ params }: PageProps<"/levels/[slug]">) {
  const { slug } = await params;
  const level = levels.find((l) => l.slug === slug);
  if (!level) notFound();
  return <PlaceholderPage title={`${level.name} scholarships`} phase={3} />;
}
