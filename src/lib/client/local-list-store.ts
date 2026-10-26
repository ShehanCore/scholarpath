"use client";

import { useSyncExternalStore } from "react";

/** A list of ids kept in localStorage and shared across components and tabs. */
export function createListStore(key: string) {
  const listeners = new Set<() => void>();
  let cache: string[] | null = null;

  const read = (): string[] => {
    if (cache) return cache;
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
      cache = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
    } catch {
      cache = [];
    }
    return cache;
  };

  const write = (ids: string[]) => {
    cache = ids;
    try {
      localStorage.setItem(key, JSON.stringify(ids));
    } catch {
      // Storage can be unavailable (private mode); keep the in-memory list.
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        cache = null;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  const empty: string[] = [];
  const useList = () => useSyncExternalStore(subscribe, read, () => empty);
  return { read, write, useList };
}
