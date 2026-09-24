"use client";

/**
 * Minimal i18n. The server renders in the reader's language (from a cookie or
 * Accept-Language, see server.ts) so there is no flash of the wrong language;
 * on the client the saved `uiLanguage` setting is the source of truth.
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import type { MessageKey } from "./messages";
import { LANG_COOKIE, resolveLocale, translate, type Locale } from "./translate";

export * from "./translate";

const LocaleContext = createContext<Locale>("en");

export function I18nProvider({ initial, children }: { initial: Locale; children: React.ReactNode }) {
  const pref = useStore((s) => s.data.settings.uiLanguage);
  const hydrated = useStore((s) => s.hydrated);
  const [locale, setLocale] = useState<Locale>(initial);

  useEffect(() => {
    if (!hydrated) return;
    const next = resolveLocale(pref, navigator.language);
    setLocale(next);
    document.documentElement.lang = next;
    // Remember the preference for server rendering of the next page load.
    document.cookie = `${LANG_COOKIE}=${pref}; path=/; max-age=31536000; samesite=lax`;
  }, [pref, hydrated]);

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export type TFunction = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function useT(): TFunction {
  const locale = useLocale();
  return useCallback((key, vars) => translate(locale, key, vars), [locale]);
}
