"use client";

/**
 * Settings live in a drawer on the right, like a sidebar in a reading app.
 * Drag its left edge to resize, or expand it to fill the screen. On phones it
 * opens as a full-width sheet.
 */

import { useCallback, useEffect, useRef } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useUi } from "@/lib/ui-state";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import {
  AccountSection,
  CursorSection,
  DataSection,
  EffectsSections,
  FontsSection,
  FunctionalitySection,
  LanguageRow,
  LooksSection,
  SoundSection,
  ThemesSection,
} from "./sections";

export const MIN_DRAWER = 300;

export function SettingsDrawer() {
  const open = useUi((s) => s.settingsOpen);
  const expanded = useUi((s) => s.settingsExpanded);
  const openSettings = useUi((s) => s.openSettings);
  const toggleExpanded = useUi((s) => s.toggleExpanded);
  const settings = useStore((s) => s.data.settings);
  const hydrated = useStore((s) => s.hydrated);
  const update = useStore((s) => s.updateSettings);
  const panelRef = useRef<HTMLElement>(null);
  const t = useT();

  // Esc closes the drawer when focus is inside it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && panelRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        openSettings(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openSettings]);

  const onResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      const onMove = (ev: PointerEvent) => {
        const width = Math.round(Math.min(window.innerWidth - 240, Math.max(MIN_DRAWER, window.innerWidth - ev.clientX)));
        document.documentElement.style.setProperty("--drawer-w", `${width}px`);
      };
      const onUp = (ev: PointerEvent) => {
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerup", onUp);
        const width = Math.round(Math.min(window.innerWidth - 240, Math.max(MIN_DRAWER, window.innerWidth - ev.clientX)));
        update({ drawerWidth: width });
      };
      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerup", onUp);
    },
    [update],
  );

  if (!hydrated) return null;

  return (
    <aside
      ref={panelRef}
      aria-label={t("settings.title")}
      aria-hidden={!open}
      data-chrome
      className={cn(
        "fixed bottom-0 right-0 top-0 z-40 flex flex-col border-l border-line bg-bg/95 shadow-[-8px_0_30px_rgb(0_0_0/0.15)] backdrop-blur transition-transform duration-200 ease-out",
        open ? "translate-x-0" : "pointer-events-none translate-x-full",
        expanded ? "left-0 w-auto" : "w-full sm:w-[var(--drawer-w)]",
      )}
      data-testid="settings-drawer"
    >
      {!expanded && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t("settings.resize")}
          onPointerDown={onResizeStart}
          className="absolute -left-1 top-0 hidden h-full w-2 cursor-col-resize hover:bg-accent/30 sm:block"
        />
      )}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
        <h2 className="text-base font-semibold">{t("settings.title")}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleExpanded}
            className="hidden rounded-md p-2 text-muted hover:bg-surface hover:text-fg sm:block"
            aria-label={expanded ? t("settings.shrink") : t("settings.expand")}
            title={expanded ? t("settings.shrink") : t("settings.expand")}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => openSettings(false)}
            className="rounded-md p-2 text-muted hover:bg-surface hover:text-fg"
            aria-label={t("settings.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className={cn("min-h-0 flex-1 overflow-y-auto px-4 pb-10", expanded && "px-8")}>
        <div className={cn(expanded && "mx-auto grid max-w-7xl gap-x-10 md:grid-cols-2 xl:grid-cols-3")}>
          <div>
            <LanguageRow settings={settings} update={update} />
            <LooksSection settings={settings} update={update} expanded={expanded} />
            <ThemesSection settings={settings} update={update} expanded={expanded} />
          </div>
          <div>
            <EffectsSections settings={settings} update={update} expanded={expanded} />
            <CursorSection settings={settings} update={update} expanded={expanded} />
            <FontsSection settings={settings} update={update} expanded={expanded} />
          </div>
          <div>
            <FunctionalitySection settings={settings} update={update} expanded={expanded} />
            <SoundSection settings={settings} update={update} expanded={expanded} />
            <AccountSection expanded={expanded} />
            <DataSection expanded={expanded} />
          </div>
        </div>
      </div>
    </aside>
  );
}
