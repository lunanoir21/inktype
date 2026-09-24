"use client";

import { useEffect } from "react";
import { STORAGE_KEY, useStore } from "@/lib/store";
import { applyTheme } from "@/lib/themes";
import { useUi } from "@/lib/ui-state";
import { scheduleSync, syncEnabled } from "@/lib/sync";

/** App-wide side effects: theming, service worker, background sync. */
export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useStore((s) => s.data.settings.theme);
  const customThemes = useStore((s) => s.data.settings.customThemes);
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    void useStore.persist.rehydrate();
    // Keep tabs in sync: another tab saved progress.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) void useStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyTheme({ theme, customThemes });
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme({ theme, customThemes });
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, customThemes, hydrated]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  // Pull from the server once per launch when this device is signed in.
  useEffect(() => {
    if (hydrated && syncEnabled()) scheduleSync();
  }, [hydrated]);

  // Width of the settings drawer, shared by the drawer and the page padding.
  const drawerWidth = useStore((s) => s.data.settings.drawerWidth);
  useEffect(() => {
    document.documentElement.style.setProperty("--drawer-w", `${Math.max(300, drawerWidth)}px`);
  }, [drawerWidth]);

  // Global shortcut: Ctrl+, opens settings.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        useUi.getState().openSettings();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return <>{children}</>;
}
