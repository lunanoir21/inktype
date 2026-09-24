"use client";

import { useT } from "@/lib/i18n";

export function SiteFooter() {
  const t = useT();
  return (
    <footer className="mt-10 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-8 text-xs text-muted sm:flex-row sm:justify-between sm:px-8">
        <p>
          {t("footer.license")}{" "}
          <a href="https://www.gutenberg.org" className="underline underline-offset-2 hover:text-fg" rel="noreferrer">
            Project Gutenberg
          </a>{" "}
          &amp;{" "}
          <a href="https://tr.wikisource.org" className="underline underline-offset-2 hover:text-fg" rel="noreferrer">
            Vikikaynak
          </a>
          .
        </p>
        <p>{t("footer.promise")}</p>
      </div>
    </footer>
  );
}
