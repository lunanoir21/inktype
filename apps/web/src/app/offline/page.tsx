import Link from "next/link";
import { translate } from "@/lib/i18n/translate";
import { getServerLocale } from "@/lib/i18n/server";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  const locale = getServerLocale();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-serif text-3xl italic">{translate(locale, "offline.title")}</h1>
      <p className="max-w-sm text-muted">{translate(locale, "offline.body")}</p>
      <Link href="/" className="mt-4 text-accent underline-offset-4 hover:underline">
        {translate(locale, "offline.home")}
      </Link>
    </main>
  );
}
