"use client";

import { createListStore } from "./local-list-store";

// Scholarships with "Remind me" switched on. Reminders are emailed, so they need an account; the list is
// mirrored here so the switches render instantly and is synced to the reminders table.
const store = createListStore("scholarpath-reminders");

export const useReminders = store.useList;

export function setReminder(id: string, on: boolean) {
  const ids = store.read().filter((x) => x !== id);
  store.write(on ? [...ids, id] : ids);
}

export function replaceReminders(ids: string[]) {
  store.write(ids);
}
