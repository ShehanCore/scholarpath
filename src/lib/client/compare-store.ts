"use client";

import { useSyncExternalStore } from "react";
import { createListStore } from "./local-list-store";

export const MAX_COMPARE = 3;
const store = createListStore("scholarpath-compare");

export const useCompare = store.useList;

// One-line notice for the compare bar's live region ("You can compare up to 3…").
let notice = { text: "", at: 0 };
const noticeListeners = new Set<() => void>();
export function useCompareNotice() {
  return useSyncExternalStore(
    (l) => {
      noticeListeners.add(l);
      return () => noticeListeners.delete(l);
    },
    () => notice,
    () => notice,
  );
}
function setNotice(text: string) {
  notice = { text, at: Date.now() };
  noticeListeners.forEach((l) => l());
}

export function toggleCompare(id: string) {
  const ids = store.read();
  if (ids.includes(id)) return store.write(ids.filter((x) => x !== id));
  if (ids.length >= MAX_COMPARE) return setNotice("You can compare up to 3 scholarships. Remove one first.");
  store.write([...ids, id]);
}

export function clearCompare() {
  store.write([]);
}
