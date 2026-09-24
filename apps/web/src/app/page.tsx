"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { computeStreak } from "@inktype/core";
import { FEATURED } from "@/lib/catalog";
import { bookHref } from "@/lib/book-key";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";
import { BookCard } from "@/components/library/book-card";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";


export default function HomePage() {
  const hydrated = useHydrated();
  const t = useT();
  const progress = useStore((s) => s.data.progress);
  const sessions = useStore((s) => s.data.sessions);

  const recent = useMemo(
    () =>
      Object.values(progress)
        .filter((p) => !p.completed)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 6),
    [progress],
  );
  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const current = recent[0];

  return (
    <>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 sm:px-8">
        <section className="py-14 sm:py-20">
          <p className="smallcaps text-sm text-muted">{t("home.eyebrow")}</p>
          <h1 className="mt-4 max-w-3xl font-serif text-[2.4rem] font-normal leading-[1.08] tracking-tight sm:text-6xl">
            {t("home.title")}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {t("home.subtitle")}
          </p>

          <div className="mt-9 flex min-h-11 flex-wrap items-center gap-3">
            {hydrated &&
              (current ? (
                <Button asChild size="lg">
                  <Link href={bookHref(current.bookKey)}>
                    {t("home.continue")} <span className="italic">{current.title}</span>
                    <ArrowRight />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link href="/read/gutenberg/1342">
                    {t("home.beginWith")} <span className="italic">Pride and Prejudice</span>
                    <ArrowRight />
                  </Link>
                </Button>
              ))}
            <Button asChild size="lg" variant="ghost">
              <Link href="/library">{t("home.browse")}</Link>
            </Button>
          </div>

          {hydrated && sessions.length > 0 && (
            <p className="mt-6 text-sm text-muted">
              {streak.current > 0 ? (
                <>
                  <span className="text-fg">{t("home.streak", { n: streak.current })}</span>
                  {streak.today ? t("home.streakDone") : t("home.streakKeep")}
                </>
              ) : (
                t("home.streakStart")
              )}
            </p>
          )}
        </section>

        {hydrated && recent.length > 0 && (
          <section className="border-t border-line py-10" aria-labelledby="continue-heading">
            <h2 id="continue-heading" className="smallcaps mb-6 text-sm text-muted">
              {t("home.desk")}
            </h2>
            <div className="grid grid-cols-3 gap-5 sm:grid-cols-4 md:grid-cols-6">
              {recent.map((p) => (
                <BookCard
                  key={p.bookKey}
                  bookKey={p.bookKey}
                  href={bookHref(p.bookKey)}
                  title={p.title}
                  author={p.author}
                  progress={p.totalPages ? p.page / p.totalPages : 0}
                  meta={t("home.pageOf", { page: Math.min(p.page + 1, p.totalPages), total: p.totalPages })}
                />
              ))}
            </div>
          </section>
        )}

        <section className="border-t border-line py-10" aria-labelledby="classics-heading">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 id="classics-heading" className="smallcaps text-sm text-muted">
              {t("home.classics")}
            </h2>
            <Link href="/library" className="text-sm text-muted hover:text-fg">
              {t("home.allBooks")}
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-5 sm:grid-cols-4 md:grid-cols-6">
            {FEATURED.map((b) => (
              <BookCard
                key={b.id}
                bookKey={`gutenberg:${b.id}`}
                href={`/read/gutenberg/${b.id}`}
                title={b.title}
                author={b.author}
              />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
