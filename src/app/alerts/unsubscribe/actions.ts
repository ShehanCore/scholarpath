"use server";

import { unsubscribeAlert } from "@/lib/unsubscribe";

export async function confirmUnsubscribe(_prev: boolean | null, form: FormData): Promise<boolean> {
  return unsubscribeAlert(String(form.get("token") ?? ""));
}
