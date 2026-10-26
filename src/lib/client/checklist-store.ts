"use client";

import { useSyncExternalStore } from "react";
import { blankChecklist, type Checklist } from "@/lib/checklist";

// Checklists kept in this browser, keyed by scholarship id ("_draft" when none is linked). Phase 7 syncs
// them to the account (checklists / checklist_items tables).
const KEY = "scholarpath-checks";
export const DRAFT = "_draft";
type All = Record<string, Checklist>;
const listeners = new Set<() => void>();
let cache: All | null = null;

function read(): All {
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    cache = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as All) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function write(all: All) {
  cache = all;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

/** Every stored checklist (null on the server and before hydration). */
export function useAllChecklists(): All | null {
  return useSyncExternalStore<All | null>(subscribe, read, () => null);
}

export function getChecklist(key: string): Checklist | undefined {
  return read()[key];
}

export function setChecklist(key: string, c: Checklist) {
  write({ ...read(), [key]: c });
}

export function updateChecklist(key: string, fn: (c: Checklist) => Checklist) {
  const all = read();
  write({ ...all, [key]: fn(all[key] ?? blankChecklist()) });
}

/** Replace every stored checklist (account sync; {} clears them on sign-out). */
export function replaceChecklists(all: All) {
  write(all);
}
