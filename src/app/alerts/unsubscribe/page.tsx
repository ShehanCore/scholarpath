import type { Metadata } from "next";
import { Suspense } from "react";
import { Panel } from "@/components/ui/panel";
import { unsubscribeKind } from "@/lib/unsubscribe";
import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata: Metadata = { title: "Stop alert", robots: { index: false, follow: false } };

export default function UnsubscribePage({ searchParams }: PageProps<"/alerts/unsubscribe">) {
  return (
    <Panel className="mx-auto mt-8 max-w-[560px]">
      <Suspense>
        <Token searchParams={searchParams} />
      </Suspense>
    </Panel>
  );
}

async function Token({ searchParams }: { searchParams: PageProps<"/alerts/unsubscribe">["searchParams"] }) {
  const { token, type } = await searchParams;
  const kind = unsubscribeKind(type);
  return (
    <>
      <h1 className="m-0 mb-3 font-heading text-[28px] font-semibold">{kind === "reminder" ? "Stop this deadline reminder?" : "Stop this reopen alert?"}</h1>
      <p className="m-0 mb-5 text-[15px] leading-[1.6] text-muted">
        {kind === "reminder"
          ? "You won't get an email 7 days before this scholarship closes. You can switch it back on in Deadlines."
          : "You won't get an email when this scholarship reopens."}
      </p>
      <UnsubscribeForm token={typeof token === "string" ? token : ""} kind={kind} />
    </>
  );
}
