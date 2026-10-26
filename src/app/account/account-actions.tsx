"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { FieldError, TextField } from "@/components/auth/auth-ui";
import { CloseButton, Dialog } from "@/components/ui/dialog";
import { useSaved } from "@/lib/client/saved-store";
import { browserClient } from "@/lib/supabase/browser";
import { deleteAccount } from "./actions";

export function AccountLinks() {
  const router = useRouter();
  const saved = useSaved().length;
  return (
    <div className="flex flex-wrap justify-between gap-2.5 border-t border-border pt-3.5">
      <Link href="/shortlist" className="flex min-h-11 items-center text-sm font-bold no-underline">
        My shortlist ({saved})
      </Link>
      <button
        type="button"
        onClick={async () => {
          await browserClient().auth.signOut();
          router.push("/?signed-out=1");
          router.refresh();
        }}
        className="min-h-11 border-0 bg-transparent p-0 text-sm font-bold text-muted"
      >
        Log out
      </button>
    </div>
  );
}

/** Your data (PDPA): download everything, or delete the account. */
export function YourData() {
  const [open, setOpen] = useState(false);
  const [error, action, pending] = useActionState(deleteAccount, null);
  return (
    <section aria-labelledby="your-data" className="flex flex-col gap-2 border-t border-border pt-3.5">
      <h2 id="your-data" className="m-0 text-xs font-bold uppercase tracking-[.06em] text-muted">
        Your data
      </h2>
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        <a href="/account/export" download className="flex min-h-11 items-center text-sm font-bold no-underline">
          Download my data
        </a>
        <button type="button" onClick={() => setOpen(true)} className="min-h-11 border-0 bg-transparent p-0 text-sm font-bold text-error">
          Delete my account
        </button>
      </div>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        label="Delete my account"
        className="m-auto w-[calc(100%-24px)] max-w-[480px] rounded-card-lg bg-surface p-[clamp(20px,4vw,32px)] text-ink shadow-modal"
      >
        <form action={action} className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="m-0 font-heading text-2xl font-semibold">Delete your account?</h2>
            <CloseButton onClick={() => setOpen(false)} label="Close" />
          </div>
          <p className="m-0 text-[15px] leading-[1.6] text-muted">
            This permanently deletes your account, study profile, saved scholarships, checklist progress, reminders and email log,
            and stops WhatsApp messages. It can&apos;t be undone. Download your data first if you want a copy.
          </p>
          <TextField label="Type DELETE to confirm" name="confirm" autoComplete="off" />
          {error && <FieldError>{error}</FieldError>}
          <button
            type="submit"
            disabled={pending}
            className="min-h-12 rounded-pill border-0 bg-error px-6 text-xs font-bold uppercase tracking-[.05em] text-white"
          >
            {pending ? "Deleting…" : "Delete my account"}
          </button>
        </form>
      </Dialog>
    </section>
  );
}
