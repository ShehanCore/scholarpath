"use client";

import { createListStore } from "./local-list-store";

// Saved scholarships for signed-out visitors, kept in this browser. Phase 7 syncs them to the account.
const store = createListStore("scholarpath-saved");

export const useSaved = store.useList;

export function toggleSaved(id: string) {
  const ids = store.read();
  store.write(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
}
