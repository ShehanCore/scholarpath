import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlaceholderPage } from "@/components/placeholder-page";
import { disciplines } from "@/lib/taxonomy";

export function generateStaticParams() {
  return disciplines.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/disciplines/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: disciplines.find((d) => d.slug === slug)?.name };
}

export default async function Page({ params }: PageProps<"/disciplines/[slug]">) {
  const { slug } = await params;
  const discipline = disciplines.find((d) => d.slug === slug);
  if (!discipline) notFound();
  return <PlaceholderPage title={`${discipline.name} scholarships`} phase={3} />;
}
