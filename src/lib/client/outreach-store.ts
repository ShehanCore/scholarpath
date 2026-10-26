"use client";

import { useSyncExternalStore } from "react";
import type { OutreachEntry, OutreachStatus } from "@/lib/outreach";

// Logged emails, newest first, kept in this browser and synced to the account (outreach table) when signed in.
const KEY = "scholarpath-outreach";
const listeners = new Set<() => void>();
let cache: OutreachEntry[] | null = null;

function read(): OutreachEntry[] {
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed)
      ? parsed.filter((e): e is OutreachEntry => !!e && typeof e === "object" && typeof (e as OutreachEntry).id === "string")
      : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(list: OutreachEntry[]) {
  cache = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
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

/** Every logged email (null on the server and before hydration). */
export function useOutreach(): OutreachEntry[] | null {
  return useSyncExternalStore<OutreachEntry[] | null>(subscribe, read, () => null);
}

/** Log a sent email; a follow-up also marks the email it follows up. */
export function logOutreach(entry: OutreachEntry, followsUp?: string | null) {
  const rest = read().map((e) => (e.id === followsUp ? { ...e, status: "followed_up" as const } : e));
  write([entry, ...rest]);
}

export function setOutreachStatus(id: string, status: OutreachStatus) {
  write(read().map((e) => (e.id === id ? { ...e, status } : e)));
}

/** Replace the whole log (account sync; [] clears it on sign-out). */
export function replaceOutreach(list: OutreachEntry[]) {
  write(list);
}
