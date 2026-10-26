"use client";

import type { User } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { authAvailable, browserClient } from "@/lib/supabase/browser";

// The signed-in user for client components (header, save sync). `undefined` until the session has been
// read, then the user or null. Pages stay static; this runs in the browser only.
type State = { user: User | null | undefined };
let state: State = { user: undefined };
const listeners = new Set<() => void>();
let started = false;

function start() {
  if (started) return;
  started = true;
  if (!authAvailable) {
    state = { user: null };
    return;
  }
  const supabase = browserClient();
  supabase.auth.getUser().then(({ data }) => set(data.user ?? null));
  supabase.auth.onAuthStateChange((_event, session) => set(session?.user ?? null));
}

function set(user: User | null) {
  if (state.user?.id === user?.id && state.user !== undefined && user?.updated_at === state.user?.updated_at) return;
  state = { user };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  start();
  return () => listeners.delete(l);
}

const serverState: State = { user: undefined };

export function useAuthUser(): User | null | undefined {
  return useSyncExternalStore(subscribe, () => state, () => serverState).user;
}

export function displayName(user: User): string {
  const meta = user.user_metadata as { name?: string; full_name?: string };
  return (meta.name || meta.full_name || user.email?.split("@")[0] || "Student").trim();
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
