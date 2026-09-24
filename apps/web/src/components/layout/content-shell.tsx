"use client";

import { useUi } from "@/lib/ui-state";
import { cn } from "@/lib/utils";

/**
 * Wraps the page. When the settings drawer is open on a wide screen the page
 * makes room for it instead of being covered, so changes preview live.
 */
export function ContentShell({ children }: { children: React.ReactNode }) {
  const open = useUi((s) => s.settingsOpen);
  const expanded = useUi((s) => s.settingsExpanded);
  return (
    <div
      className={cn("flex min-h-dvh flex-col transition-[padding] duration-200 ease-out", open && !expanded && "sm:pr-[var(--drawer-w)]")}
    >
      {children}
    </div>
  );
}
