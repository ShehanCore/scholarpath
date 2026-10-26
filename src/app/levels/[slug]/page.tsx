import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryPage } from "@/components/category-page";
import { getDestinations, getScholarships } from "@/lib/db/queries";
import { levels } from "@/lib/taxonomy";
import { getToday } from "@/lib/today";

export function generateStaticParams() {
  return levels.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps<"/levels/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const l = levels.find((x) => x.slug === slug);
  return l ? { title: `${l.name} scholarships`, description: `Funding for ${l.name} study abroad.` } : {};
}

export default async function Page({ params }: PageProps<"/levels/[slug]">) {
  const { slug } = await params;
  const l = levels.find((x) => x.slug === slug);
  if (!l) notFound();
  const [scholarships, destinations, today] = await Promise.all([getScholarships(), getDestinations(), getToday()]);
  return (
    <CategoryPage
      kind="Study level"
      title={l.name}
      sub={l.sub}
      intro={`Funding for ${l.name} study abroad. One scholarship can cover several levels, so some awards also appear under other levels.`}
      tabs={levels.map((x) => ({ label: x.name, href: `/levels/${x.slug}`, current: x.slug === slug }))}
      scholarships={scholarships.filter((s) => s.levels.includes(l.code))}
      destinations={destinations}
      today={today}
      finderHref={`/scholarships?lv=${l.code}`}
    />
  );
}
