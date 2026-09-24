"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Link2, Pencil, Trash2 } from "lucide-react";
import { paginate, type CustomText } from "@inktype/core";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useT } from "@/lib/i18n";

const MAX_CHARS = 2_000_000;

export default function CustomTextsPage() {
  const hydrated = useHydrated();
  const t = useT();
  const router = useRouter();
  const texts = useStore((s) => s.data.customTexts);
  const progress = useStore((s) => s.data.progress);
  const { addCustomText, updateCustomText, deleteCustomText } = useStore.getState();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sourceUrl, setSourceUrl] = useState<string | undefined>();
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paginating is cheap for normal texts; estimate for huge pastes.
  const deferredBody = useDeferredValue(body);
  const pageCount = useMemo(() => {
    if (!deferredBody.trim()) return 0;
    return deferredBody.length > 60_000 ? Math.ceil(deferredBody.length / 350) : paginate(deferredBody).length;
  }, [deferredBody]);

  const reset = () => {
    setEditingId(null);
    setTitle("");
    setBody("");
    setSourceUrl(undefined);
    setError(null);
  };

  const save = (andType: boolean) => {
    const text = body.trim();
    if (!text) {
      setError(t("custom.errEmpty"));
      return;
    }
    if (text.length > MAX_CHARS) {
      setError(t("custom.errLong"));
      return;
    }
    const name = title.trim() || text.split(/\s+/).slice(0, 6).join(" ");
    let id = editingId;
    if (id) updateCustomText(id, { title: name, body: text });
    else id = addCustomText({ title: name, body: text, sourceUrl });
    reset();
    if (andType) router.push(`/read/custom/${id}`);
  };

  const importUrl = async () => {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = (await res.json()) as { title?: string; text?: string; error?: string };
      if (!res.ok || !json.text) throw new Error("import");
      setTitle(json.title ?? "");
      setBody(json.text);
      setSourceUrl(url.trim());
      setUrl("");
    } catch (e) {
      setError(t("custom.errImport"));
    } finally {
      setImporting(false);
    }
  };

  const edit = (t: CustomText) => {
    setEditingId(t.id);
    setTitle(t.title);
    setBody(t.body);
    setSourceUrl(t.sourceUrl);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-24 sm:px-8">
      <div className="pb-8 pt-10 sm:pt-14">
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">{t("custom.title")}</h1>
        <p className="mt-3 text-muted">{t("custom.intro")}</p>
      </div>

      <section aria-label={editingId ? t("custom.editText") : t("custom.newText")} className="space-y-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim()) void importUrl();
          }}
        >
          <label className="relative flex-1">
            <span className="sr-only">{t("custom.importLabel")}</span>
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              type="url"
              inputMode="url"
              placeholder={t("custom.importPlaceholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-9"
            />
          </label>
          <Button type="submit" variant="outline" disabled={importing || !url.trim()}>
            {importing ? t("custom.fetching") : t("custom.import")}
          </Button>
        </form>

        <Input
          placeholder={t("custom.titlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          aria-label={t("custom.titleLabel")}
        />
        <Textarea
          placeholder={t("custom.bodyPlaceholder")}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[240px] font-serif text-base"
          aria-label={t("custom.bodyLabel")}
          data-testid="custom-body"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs tabular-nums text-muted">
            {t("custom.chars", { n: body.length.toLocaleString() })}
            {pageCount > 0 && ` · ${pageCount === 1 ? t("custom.page") : t("custom.pages", { n: pageCount })}`}
          </p>
          <div className="flex gap-2">
            {editingId && (
              <Button variant="ghost" onClick={reset}>
                {t("custom.cancel")}
              </Button>
            )}
            <Button variant="outline" onClick={() => save(false)} disabled={!body.trim()}>
              {t("custom.save")}
            </Button>
            <Button onClick={() => save(true)} disabled={!body.trim()} data-testid="custom-start">
              {editingId ? t("custom.saveAndType") : t("custom.start")}
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        )}
      </section>

      {hydrated && texts.length > 0 && (
        <section className="mt-14" aria-labelledby="saved-heading">
          <h2 id="saved-heading" className="smallcaps mb-2 border-b border-line pb-2 text-sm text-muted">
            {t("custom.saved")}
          </h2>
          <ul className="divide-y divide-line/60">
            {texts.map((text) => {
              const p = progress[`custom:${text.id}`];
              const pct = p && p.totalPages ? Math.round((Math.min(p.page, p.totalPages) / p.totalPages) * 100) : 0;
              return (
                <li key={text.id} className="flex items-center gap-4 py-4">
                  <Link href={`/read/custom/${text.id}`} className="min-w-0 flex-1 group">
                    <p className="truncate font-serif text-lg group-hover:text-accent">{text.title}</p>
                    <p className="truncate text-xs text-muted">
                      {t("custom.chars", { n: text.body.length.toLocaleString() })}
                      {p ? ` · ${t("custom.typedPct", { n: pct })}` : ""}
                      {text.sourceUrl ? ` · ${t("custom.from", { host: safeHost(text.sourceUrl) })}` : ""}
                    </p>
                  </Link>
                  <Button variant="ghost" size="icon" aria-label={t("custom.edit", { title: text.title })} onClick={() => edit(text)}>
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("custom.delete", { title: text.title })}
                    onClick={() => {
                      if (window.confirm(t("custom.confirmDelete", { title: text.title }))) deleteCustomText(text.id);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
