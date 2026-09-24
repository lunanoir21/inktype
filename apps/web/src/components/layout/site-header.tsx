"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, PenLine, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUi } from "@/lib/ui-state";
import { useStore } from "@/lib/store";
import { Logo } from "./logo";
import { useT } from "@/lib/i18n";

const NAV = [
  { href: "/library", label: "nav.library", icon: BookOpen },
  { href: "/custom", label: "nav.texts", icon: PenLine },
  { href: "/stats", label: "nav.stats", icon: BarChart3 },
] as const;

/**
 * Minimal top bar. While typing it fades to near-invisible; in focus mode it
 * disappears entirely.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const typing = useUi((s) => s.typing);
  const focusMode = useStore((s) => s.data.settings.focusMode);
  const openSettings = useUi((s) => s.openSettings);
  const t = useT();
  const hidden = typing && focusMode;

  // The reader has its own top bar.
  if (pathname.startsWith("/read/")) return null;

  return (
    <header
      data-chrome
      className={cn(
        "sticky top-0 z-20 shrink-0 bg-bg/90 backdrop-blur transition-opacity duration-300 supports-[backdrop-filter]:bg-bg/70",
        hidden ? "pointer-events-none opacity-0" : typing ? "opacity-20 hover:opacity-100" : "opacity-100",
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="rounded-sm" aria-label={t("nav.home")}>
          <Logo />
        </Link>
        <nav aria-label="Main">
          <ul className="flex items-center gap-1 sm:gap-2">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                      active ? "text-fg" : "text-muted hover:text-fg",
                    )}
                  >
                    <Icon className="h-4 w-4 sm:hidden" aria-hidden />
                    <span className="sr-only sm:not-sr-only">{t(label)}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => openSettings()}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted transition-colors hover:text-fg"
                aria-label={t("nav.settings")}
                data-testid="open-settings"
              >
                <Settings className="h-4 w-4" aria-hidden />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
