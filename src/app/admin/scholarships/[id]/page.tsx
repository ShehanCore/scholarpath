import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Eyebrow, Panel } from "@/components/ui/panel";
import { designScholarships } from "@/lib/content/design-data";
import { serviceClient, serviceConfigured } from "@/lib/db/service-client";
import { toScholarship } from "@/lib/db/queries";
import { todayIso } from "@/lib/status";
import { ScholarshipForm } from "./scholarship-form";

export const metadata: Metadata = { title: "Edit scholarship" };

// Same ids as the public pages; the record itself is always read fresh below.
export function generateStaticParams() {
  return designScholarships().map((s) => ({ id: s.id }));
}

export default function EditScholarshipPage({ params }: PageProps<"/admin/scholarships/[id]">) {
  return (
    <Suspense fallback={<p className="mt-10 text-sm text-muted">Loading…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/scholarships/[id]">["params"] }) {
  await connection();
  const { id } = await params;
  let s;
  if (serviceConfigured) {
    const { data } = await serviceClient().from("scholarships").select("*").eq("id", id).maybeSingle();
    s = data ? toScholarship(data) : null;
  } else s = designScholarships().find((x) => x.id === id) ?? null;

  return (
    <>
      <div className="pt-4">
        <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Scholarships", href: "/admin/scholarships" }, { label: s?.name ?? "Not found" }]} />
      </div>
      <section className="px-1 pt-[clamp(16px,3vw,32px)] pb-6">
        <Eyebrow className="mb-3 text-teal">Edit scholarship</Eyebrow>
        <h1 className="m-0 font-heading text-[clamp(28px,3.4vw,40px)] leading-[1.1] font-semibold">{s?.name ?? "Scholarship not found"}</h1>
        {s && (
          <p className="mt-3 mb-0 max-w-[680px] text-[15px] leading-[1.6] text-muted">
            Open the <a href={s.officialUrl} target="_blank" rel="noopener">official website</a> and copy facts exactly. Don&apos;t add funding
            amounts or what it covers: the page links to the official website for that. Leave anything that isn&apos;t published empty.
          </p>
        )}
      </section>
      {s && (
        <Panel>
          {!serviceConfigured && (
            <p role="note" className="mt-0 mb-4 rounded-input bg-warning-bg px-4 py-3 text-sm text-warning-fg">
              Read-only: connect Supabase to save.
            </p>
          )}
          <ScholarshipForm s={s} today={todayIso()} editable={serviceConfigured} />
        </Panel>
      )}
    </>
  );
}
