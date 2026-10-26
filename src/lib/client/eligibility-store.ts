"use client";

import { useSyncExternalStore } from "react";

// "I meet this" answers per scholarship, kept in this browser until accounts sync them (Phase 7).
const KEY = "scholarpath-elig";
type Answers = Record<string, number[]>;
const listeners = new Set<() => void>();
let cache: Answers | null = null;

function read(): Answers {
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    cache = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Answers) : {};
  } catch {
    cache = {};
  }
  return cache;
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

const none: number[] = [];

export function useEligibility(scholarshipId: string): number[] {
  return useSyncExternalStore(subscribe, () => read()[scholarshipId] ?? none, () => none);
}

export function toggleEligibility(scholarshipId: string, index: number) {
  const all = read();
  const cur = all[scholarshipId] ?? [];
  const next = cur.includes(index) ? cur.filter((i) => i !== index) : [...cur, index];
  cache = { ...all, [scholarshipId]: next };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
  listeners.forEach((l) => l());
}
