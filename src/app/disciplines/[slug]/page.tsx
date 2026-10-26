import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryPage } from "@/components/category-page";
import { getDestinations, getScholarships } from "@/lib/db/queries";
import { disciplines } from "@/lib/taxonomy";
import { getToday } from "@/lib/today";

export function generateStaticParams() {
  return disciplines.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/disciplines/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const d = disciplines.find((x) => x.slug === slug);
  return d ? { title: `${d.name} scholarships`, description: `Scholarships and research funding for ${d.name}.` } : {};
}

export default async function Page({ params }: PageProps<"/disciplines/[slug]">) {
  const { slug } = await params;
  const d = disciplines.find((x) => x.slug === slug);
  if (!d) notFound();
  const [scholarships, destinations, today] = await Promise.all([getScholarships(), getDestinations(), getToday()]);
  return (
    <CategoryPage
      kind="Discipline"
      title={d.name}
      sub={d.includes}
      intro={`Scholarships and research funding for ${d.name}, including awards open to all disciplines. Subject-specific awards are marked separately.`}
      tabs={disciplines.map((x) => ({ label: x.name, href: `/disciplines/${x.slug}`, current: x.slug === slug }))}
      scholarships={scholarships.filter((s) => s.disciplinesAll || s.disciplines.includes(d.name))}
      destinations={destinations}
      today={today}
      finderHref={`/scholarships?disc=${d.slug}`}
    />
  );
}
