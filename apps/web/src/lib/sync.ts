"use client";

/**
 * Optional sync with a self-hosted Inktype server.
 */

import { useStore } from "./store";

export interface Account {
  id: string;
  username: string;
}

export async function fetchAccount(): Promise<{ user: Account | null; registrationOpen: boolean }> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return { user: null, registrationOpen: false };
    return (await res.json()) as { user: Account | null; registrationOpen: boolean };
  } catch {
    return { user: null, registrationOpen: false };
  }
}

export async function authenticate(
  mode: "login" | "register",
  username: string,
  password: string,
): Promise<Account> {
  const res = await fetch(`/api/auth/${mode}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const json = (await res.json().catch(() => ({}))) as { user?: Account; error?: string };
  if (!res.ok || !json.user) throw new Error(json.error ?? "Something went wrong.");
  return json.user;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
  window.localStorage.removeItem(SYNC_FLAG);
}

/** Remember that this device is signed in so we can auto-sync after pages. */
export const SYNC_FLAG = "inktype:sync-enabled";

export function markSyncEnabled(on: boolean): void {
  if (on) window.localStorage.setItem(SYNC_FLAG, "1");
  else window.localStorage.removeItem(SYNC_FLAG);
}

export function syncEnabled(): boolean {
  try {
    return window.localStorage.getItem(SYNC_FLAG) === "1";
  } catch {
    return false;
  }
}

let inflight: Promise<void> | null = null;

/** Push local data, receive the merged document, and adopt it locally. */
export function syncNow(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, replaceData } = useStore.getState();
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.status === 401) {
      markSyncEnabled(false);
      throw new Error("Signed out — please sign in again.");
    }
    if (!res.ok) throw new Error("Sync failed.");
    replaceData(await res.json());
    window.localStorage.setItem("inktype:last-sync", new Date().toISOString());
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

let timer: ReturnType<typeof setTimeout> | undefined;

/** Debounced background sync, used after each completed page. */
export function scheduleSync(): void {
  if (!syncEnabled() || !navigator.onLine) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    syncNow().catch(() => undefined);
  }, 3000);
}
