import Link from "next/link";
import { translate } from "@/lib/i18n/translate";
import { getServerLocale } from "@/lib/i18n/server";

export default function NotFound() {
  const locale = getServerLocale();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="smallcaps text-sm text-muted">404</p>
      <h1 className="font-serif text-3xl italic">{translate(locale, "notFound.title")}</h1>
      <Link href="/" className="mt-4 text-accent underline-offset-4 hover:underline">
        {translate(locale, "notFound.home")}
      </Link>
    </main>
  );
}
