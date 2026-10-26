import type { Metadata } from "next";
import { Suspense } from "react";
import { Panel } from "@/components/ui/panel";
import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata: Metadata = { title: "Stop alert", robots: { index: false, follow: false } };

export default function UnsubscribePage({ searchParams }: PageProps<"/alerts/unsubscribe">) {
  return (
    <Panel className="mx-auto mt-8 max-w-[560px]">
      <h1 className="m-0 mb-3 font-heading text-[28px] font-semibold">Stop this reopen alert?</h1>
      <p className="m-0 mb-5 text-[15px] leading-[1.6] text-muted">
        You won&apos;t get an email when this scholarship reopens.
      </p>
      <Suspense>
        <Token searchParams={searchParams} />
      </Suspense>
    </Panel>
  );
}

async function Token({ searchParams }: { searchParams: PageProps<"/alerts/unsubscribe">["searchParams"] }) {
  const token = (await searchParams).token;
  return <UnsubscribeForm token={typeof token === "string" ? token : ""} />;
}
